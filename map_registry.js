// 라운드 로테이션에 사용하는 맵 목록.
// 키 이름은 서버 config.js 의 MAP_ROTATION 과 반드시 일치해야 한다.
// 새 맵 추가 절차: tools/generate_maps.js 로 map_*.js 생성(또는 수동 작성)
//  -> framework.js requireScripts 등록 -> 여기 등록 -> 서버 MAP_ROTATION 에 추가
const MAP_REGISTRY = {
  office: map_office_data,
  arena: map_arena_data,
  ruins: map_ruins_data,
};

// 서버 MAP_ROTATION[0] 과 같아야 한다 (접속 직후 round_info 수신 전까지의 기본값)
const DEFAULT_MAP_NAME = "office";
