// PvE 침공 몬스터(스켈레톤)를 보관·보간·렌더링한다. 아이템과 마찬가지로 서버 권위이며
// 클라이언트는 표시만 한다. 서버 메시지: monster_list(접속 스냅샷), monster_spawn,
// monster_positions(30fps 묶음 갱신), monster_hp, monster_attack, monster_die.
//
// 스프라이트 렌더링은 sprite_class.js 의 NpcCharacterClass 가 맡고, 여기서는 그 렌더러가
// 요구하는 엔티티 인터페이스(getStatus/isMoving/getCenterX/getDirection/...)를 제공한다.

// 단일 몬스터 엔티티. 서버는 30fps 로 위치를 보내므로 렌더 프레임마다 보간한다.
class NpcClass {
  constructor(id, x, y, hp, maxHp, direction) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.width = 32;
    this.height = 32;
    this.hp = hp;
    this.maxHp = maxHp ? maxHp : 100;
    this.direction = direction ? direction : 0;
    this.status = "idle"; // "idle" | "move" | "meleeattack"
    this.attackStartTime = 0;
    this.attackFrame = undefined;
    this.lastMoveTime = 0;
    this.moving = false;
  }

  getId() {
    return this.id;
  }
  getPositionX() {
    return this.x;
  }
  getPositionY() {
    return this.y;
  }
  getCenterX() {
    return this.x + this.width / 2;
  }
  getCenterY() {
    return this.y + this.height / 2;
  }
  getWidth() {
    return this.width;
  }
  getHeight() {
    return this.height;
  }
  getDirection() {
    return this.direction;
  }
  getDestinationX() {
    return this.targetX;
  }
  getDestinationY() {
    return this.targetY;
  }
  // 렌더러의 체력바는 0~100 기준이므로 비율(%)로 환산해 돌려준다(만피면 바 숨김)
  getHp() {
    return Math.round((this.hp / this.maxHp) * 100);
  }
  setHp(hp) {
    this.hp = hp;
  }
  getStatus() {
    return this.status;
  }
  isMoving() {
    return this.moving;
  }
  getCurrentStatusFrame() {
    return this.status === "meleeattack" ? this.attackFrame : undefined;
  }

  setTarget(x, y, direction) {
    this.targetX = x;
    this.targetY = y;
    if (direction !== undefined) {
      this.direction = direction;
    }
  }

  triggerAttack() {
    this.status = "meleeattack";
    this.attackStartTime = performance.now();
    this.attackFrame = 0;
  }

  frame() {
    const now = performance.now();

    // 위치 보간(서버 30fps 갱신을 부드럽게). 큰 점프(리스폰 등)는 즉시 스냅한다.
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > 300) {
      this.x = this.targetX;
      this.y = this.targetY;
      this.moving = false;
    } else if (distance > 0.5) {
      this.x += dx * 0.4;
      this.y += dy * 0.4;
      this.lastMoveTime = now;
      this.moving = true;
    } else {
      this.x = this.targetX;
      this.y = this.targetY;
      // 마지막 이동 직후 잠깐은 이동 애니메이션을 유지한다(깜빡임 방지)
      this.moving = now - this.lastMoveTime < 150;
    }

    // 공격 애니메이션(9프레임 @10fps)을 한 번 재생하고 원래 상태로 복귀
    if (this.status === "meleeattack") {
      const frame = Math.floor((now - this.attackStartTime) / (1000 / 10));
      if (frame >= 9) {
        this.status = this.moving ? "move" : "idle";
        this.attackFrame = undefined;
      } else {
        this.attackFrame = frame;
      }
    } else {
      this.status = this.moving ? "move" : "idle";
    }
  }
}

// 몬스터 컬렉션 관리 + 렌더링. 렌더러(NpcCharacterClass)를 1개만 공유한다.
class MonsterManagerClass {
  constructor() {
    this.monsters = {};
    this.npcCharacterClass = new NpcCharacterClass();
  }

  setMonsters(list) {
    this.monsters = {};
    if (list) {
      for (let i = 0; i < list.length; i++) {
        this.addMonster(list[i]);
      }
    }
  }

  addMonster(data) {
    if (data) {
      this.monsters[data.id] = new NpcClass(
        data.id,
        data.x,
        data.y,
        data.hp,
        data.maxHp,
        data.direction,
      );
    }
  }

  removeMonster(id) {
    delete this.monsters[id];
  }

  getMonster(id) {
    return this.monsters[id];
  }

  updatePositions(list) {
    if (!list) {
      return;
    }
    for (let i = 0; i < list.length; i++) {
      const monster = this.monsters[list[i].id];
      if (monster) {
        monster.setTarget(list[i].x, list[i].y, list[i].direction);
      }
    }
  }

  setHp(id, hp) {
    const monster = this.monsters[id];
    if (monster) {
      monster.setHp(hp);
    }
  }

  // 공격 애니메이션을 재생하고 해당 몬스터를 반환한다(호출부에서 사운드 재생용)
  triggerAttack(id) {
    const monster = this.monsters[id];
    if (monster) {
      monster.triggerAttack();
    }
    return monster;
  }

  clear() {
    this.monsters = {};
  }

  frame() {
    const ids = Object.keys(this.monsters);
    for (let i = 0; i < ids.length; i++) {
      this.monsters[ids[i]].frame();
    }
  }

  drawMonsters(drawingContext, cameraClass) {
    if (!this.npcCharacterClass.isLoaded()) {
      return;
    }
    const ids = Object.keys(this.monsters);
    for (let i = 0; i < ids.length; i++) {
      const monster = this.monsters[ids[i]];
      if (!monster) {
        continue;
      }
      if (
        !cameraClass.containsBox(
          monster.getPositionX(),
          monster.getPositionY(),
          monster.getWidth(),
          monster.getHeight(),
        )
      ) {
        continue;
      }
      this.npcCharacterClass.drawCharacter(drawingContext, monster, cameraClass);
    }
  }
}
