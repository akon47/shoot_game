"use strict";

// 맵 데이터 생성기 (Node 스크립트, 게임 런타임과 무관)
// 사용법: 저장소 루트에서 `node tools/generate_maps.js`
// 출력: map_arena.js, map_ruins.js (시드 고정이라 항상 같은 결과가 나온다)
//
// 타일 문법은 map_office.js 의 관례를 따른다:
//   1  바닥        13 공허(외곽, 검정)   16 가로벽
//   14 방 왼쪽 벽  12 방 오른쪽 벽
//   20/21/15/17 모서리(좌상/우상/좌하/우하)
//   6/7 실내 세로 기둥(캡/몸통)   9/10/11 실내 가로 가림벽(좌/중/우)

const fs = require("fs");
const path = require("path");

const VOID = 13;
const FLOOR = 1;

// map_office.js 와 동일한 충돌 타일 목록
const WALL_TILES = [
  2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,
  23, 24, 25, 26, 27, 28, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44,
];

// 시드 고정 PRNG (mulberry32)
function createRandom(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function createGrid(width, height) {
  const data = new Array(width * height).fill(VOID);
  return {
    width: width,
    height: height,
    data: data,
    get(x, y) {
      if (x < 0 || y < 0 || x >= width || y >= height) {
        return VOID;
      }
      return data[y * width + x];
    },
    set(x, y, tile) {
      if (x >= 0 && y >= 0 && x < width && y < height) {
        data[y * width + x] = tile;
      }
    },
    isFloor(x, y) {
      return this.get(x, y) === FLOOR;
    },
  };
}

function carveFloorRect(grid, left, top, right, bottom) {
  for (let y = top; y <= bottom; y++) {
    for (let x = left; x <= right; x++) {
      grid.set(x, y, FLOOR);
    }
  }
}

// 바닥과 접한 공허 칸을 office 맵과 같은 규칙의 벽 타일로 바꾼다
function applyAutoWalls(grid) {
  const result = [];
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      if (grid.get(x, y) !== VOID) {
        continue;
      }
      const fN = grid.isFloor(x, y - 1);
      const fS = grid.isFloor(x, y + 1);
      const fE = grid.isFloor(x + 1, y);
      const fW = grid.isFloor(x - 1, y);
      const fNE = grid.isFloor(x + 1, y - 1);
      const fNW = grid.isFloor(x - 1, y - 1);
      const fSE = grid.isFloor(x + 1, y + 1);
      const fSW = grid.isFloor(x - 1, y + 1);

      let tile = undefined;
      if (fE && fW) {
        tile = 7; // 양쪽이 바닥인 세로 칸막이
      } else if (fN && fS) {
        tile = 16; // 위아래가 바닥인 가로 칸막이
      } else if (fE) {
        tile = 14; // 동쪽이 바닥 -> 방의 왼쪽 벽
      } else if (fW) {
        tile = 12; // 서쪽이 바닥 -> 방의 오른쪽 벽
      } else if (fS) {
        tile = 16; // 남쪽이 바닥 -> 방의 위쪽 벽
      } else if (fN) {
        tile = 16; // 북쪽이 바닥 -> 방의 아래쪽 벽
      } else if (fSE) {
        tile = 20; // 좌상단 모서리
      } else if (fSW) {
        tile = 21; // 우상단 모서리
      } else if (fNE) {
        tile = 15; // 좌하단 모서리
      } else if (fNW) {
        tile = 17; // 우하단 모서리
      }
      if (tile !== undefined) {
        result.push({ x: x, y: y, tile: tile });
      }
    }
  }
  for (let i = 0; i < result.length; i++) {
    grid.set(result[i].x, result[i].y, result[i].tile);
  }
}

// 실내 가로 가림벽 (9, 10...10, 11)
function placeHorizontalBar(grid, x, y, width) {
  grid.set(x, y, 9);
  for (let i = 1; i < width - 1; i++) {
    grid.set(x + i, y, 10);
  }
  grid.set(x + width - 1, y, 11);
}

// 실내 세로 기둥 (6 캡 + 7 몸통)
function placeVerticalBar(grid, x, y, height) {
  grid.set(x, y, 6);
  for (let i = 1; i < height; i++) {
    grid.set(x, y + i, 7);
  }
}

// 모든 바닥이 한 덩어리로 이어져 있는지 검사 (고립 지역 방지)
function assertConnected(grid, mapName) {
  let start = undefined;
  let floorCount = 0;
  for (let y = 0; y < grid.height; y++) {
    for (let x = 0; x < grid.width; x++) {
      if (grid.isFloor(x, y)) {
        floorCount++;
        if (!start) {
          start = { x: x, y: y };
        }
      }
    }
  }
  if (!start) {
    throw new Error(mapName + ": 바닥이 없습니다");
  }

  const visited = new Set();
  const queue = [start];
  visited.add(start.y * grid.width + start.x);
  while (queue.length > 0) {
    const cell = queue.pop();
    const neighbors = [
      { x: cell.x + 1, y: cell.y },
      { x: cell.x - 1, y: cell.y },
      { x: cell.x, y: cell.y + 1 },
      { x: cell.x, y: cell.y - 1 },
    ];
    for (let i = 0; i < neighbors.length; i++) {
      const next = neighbors[i];
      const key = next.y * grid.width + next.x;
      if (grid.isFloor(next.x, next.y) && !visited.has(key)) {
        visited.add(key);
        queue.push(next);
      }
    }
  }

  if (visited.size !== floorCount) {
    throw new Error(
      mapName +
        ": 고립된 바닥 발견 (" +
        visited.size +
        "/" +
        floorCount +
        " 연결됨)",
    );
  }
  console.log(
    mapName + ": 바닥 " + floorCount + "칸, 전부 연결됨 (connectivity OK)",
  );
}

// ---------------------------------------------------------------------------
// 맵 1: arena — 대칭형 개활지. 중앙 링 구조물과 사분면 엄폐물 위주의 교전 맵
// ---------------------------------------------------------------------------
function generateArena() {
  const size = 100;
  const grid = createGrid(size, size);

  carveFloorRect(grid, 8, 8, 91, 91);

  // 중앙 링: 사방에 출입구가 뚫린 정사각 구조물
  const ringLeft = 40;
  const ringRight = 59;
  for (let x = ringLeft; x <= ringRight; x++) {
    if (x < 47 || x > 52) {
      grid.set(x, 40, 10);
      grid.set(x, 59, 10);
    }
  }
  for (let y = 41; y <= 58; y++) {
    if (y < 47 || y > 52) {
      grid.set(ringLeft, y, 7);
      grid.set(ringRight, y, 7);
    }
  }
  // 링 모서리 캡
  grid.set(ringLeft, 40, 9);
  grid.set(ringRight, 40, 11);
  grid.set(ringLeft, 59, 9);
  grid.set(ringRight, 59, 11);

  // 사분면 L자 엄폐물 (대칭)
  const corners = [
    { x: 20, y: 20, dx: 1, dy: 1 },
    { x: 79, y: 20, dx: -1, dy: 1 },
    { x: 20, y: 79, dx: 1, dy: -1 },
    { x: 79, y: 79, dx: -1, dy: -1 },
  ];
  for (let i = 0; i < corners.length; i++) {
    const c = corners[i];
    const barX = c.dx > 0 ? c.x : c.x - 7;
    placeHorizontalBar(grid, barX, c.y, 8);
    const pillarY = c.dy > 0 ? c.y + 1 : c.y - 7;
    placeVerticalBar(grid, c.x, pillarY, 7);
  }

  // 변 중앙 가림벽 (대칭)
  placeHorizontalBar(grid, 44, 22, 12);
  placeHorizontalBar(grid, 44, 77, 12);
  placeVerticalBar(grid, 22, 44, 12);
  placeVerticalBar(grid, 77, 44, 12);

  // 보조 기둥 (대칭)
  const pillars = [
    [32, 32],
    [67, 32],
    [32, 67],
    [67, 67],
  ];
  for (let i = 0; i < pillars.length; i++) {
    placeVerticalBar(grid, pillars[i][0], pillars[i][1], 2);
  }

  applyAutoWalls(grid);
  assertConnected(grid, "arena");
  return { name: "arena", grid: grid };
}

// ---------------------------------------------------------------------------
// 맵 2: ruins — 격자형 방/복도 미로. 좁은 시야와 근접전 위주의 맵
// ---------------------------------------------------------------------------
function generateRuins() {
  const size = 120;
  const grid = createGrid(size, size);
  const random = createRandom(20260612);

  const left = 6;
  const top = 6;
  const right = 113;
  const bottom = 113;
  carveFloorRect(grid, left, top, right, bottom);

  const cellSize = 12;
  const lines = [];
  for (let v = left + cellSize; v < right; v += cellSize) {
    lines.push(v);
  }

  // 세로 벽 라인: 교차점 사이 구간(segment)마다 35% 확률로 생략, 아니면 3칸짜리 문을 뚫는다
  for (let i = 0; i < lines.length; i++) {
    const x = lines[i];
    let segmentTop = top;
    for (let j = 0; j <= lines.length; j++) {
      const segmentBottom = j < lines.length ? lines[j] - 1 : bottom;
      if (random() >= 0.35) {
        const doorStart =
          segmentTop +
          1 +
          Math.floor(random() * (segmentBottom - segmentTop - 3));
        for (let y = segmentTop; y <= segmentBottom; y++) {
          if (y < doorStart || y > doorStart + 2) {
            grid.set(x, y, 7);
          }
        }
      }
      segmentTop = segmentBottom + 2;
    }
  }

  // 가로 벽 라인
  for (let i = 0; i < lines.length; i++) {
    const y = lines[i];
    let segmentLeft = left;
    for (let j = 0; j <= lines.length; j++) {
      const segmentRight = j < lines.length ? lines[j] - 1 : right;
      if (random() >= 0.35) {
        const doorStart =
          segmentLeft +
          1 +
          Math.floor(random() * (segmentRight - segmentLeft - 3));
        for (let x = segmentLeft; x <= segmentRight; x++) {
          if (x < doorStart || x > doorStart + 2) {
            grid.set(x, y, 16);
          }
        }
      }
      segmentLeft = segmentRight + 2;
    }
  }

  // 교차점: 인접 라인 벽이 하나라도 있으면 채운다 (벽 모양 끊김 방지)
  for (let i = 0; i < lines.length; i++) {
    for (let j = 0; j < lines.length; j++) {
      const x = lines[i];
      const y = lines[j];
      if (
        grid.get(x + 1, y) !== FLOOR ||
        grid.get(x - 1, y) !== FLOOR ||
        grid.get(x, y + 1) !== FLOOR ||
        grid.get(x, y - 1) !== FLOOR
      ) {
        grid.set(x, y, 16);
      }
    }
  }

  // 넓은 방에 기둥 흩뿌리기 (주변 5x5가 전부 바닥일 때만 — 1칸짜리 끼임 통로 방지)
  let placedPillars = 0;
  for (let attempt = 0; attempt < 600 && placedPillars < 30; attempt++) {
    const x = left + 2 + Math.floor(random() * (right - left - 4));
    const y = top + 2 + Math.floor(random() * (bottom - top - 4));
    let clear = true;
    for (let dy = -2; dy <= 2 && clear; dy++) {
      for (let dx = -2; dx <= 2 && clear; dx++) {
        if (!grid.isFloor(x + dx, y + dy)) {
          clear = false;
        }
      }
    }
    if (clear) {
      placeVerticalBar(grid, x, y, 2);
      placedPillars++;
    }
  }

  applyAutoWalls(grid);
  assertConnected(grid, "ruins");
  return { name: "ruins", grid: grid };
}

// ---------------------------------------------------------------------------
// 파일 출력 (map_office.js 와 같은 형식)
// ---------------------------------------------------------------------------
function writeMapFile(map) {
  const grid = map.grid;
  const varName = "map_" + map.name + "_data";
  const rows = [];
  for (let y = 0; y < grid.height; y++) {
    rows.push(
      "        " +
        grid.data.slice(y * grid.width, (y + 1) * grid.width).join(", "),
    );
  }

  const content =
    "// 이 파일은 tools/generate_maps.js 가 생성한다. 직접 수정하지 말 것.\n" +
    "const " +
    varName +
    " = {\n" +
    "    name: '" +
    map.name +
    "', tile_src: 'images/office.png', width: " +
    grid.width +
    ", height: " +
    grid.height +
    ", tile_width: 32, tile_height: 32,\n" +
    "    wall_tiles: [" +
    WALL_TILES.join(", ") +
    "],\n" +
    "    data: [\n" +
    rows.join(",\n") +
    "\n    ]\n" +
    "};\n\n" +
    "// 서버(map-helper.js)가 require 로 읽을 수 있도록 내보낸다 (브라우저에서는 무시)\n" +
    "if (typeof module !== 'undefined') {\n" +
    "    module.exports.mapData = " +
    varName +
    ";\n" +
    "}\n";

  const filePath = path.join(__dirname, "..", "map_" + map.name + ".js");
  fs.writeFileSync(filePath, content);
  console.log("작성됨: " + filePath);
}

writeMapFile(generateArena());
writeMapFile(generateRuins());
console.log("완료");
