# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

HTML5 Canvas 기반 멀티플레이 슈팅 웹 게임의 **클라이언트** 프로젝트.
서버는 별도 저장소인 `C:\Users\hwank\source\repos\shoot_game_server` (Node.js, `ws` 기반)에 있다.
데모: https://shootgame.kimhwan.kr/

- 빌드 시스템/패키지 매니저/테스트/린트 **없음**. 순수 정적 파일(Vanilla JS ES6 클래스)이다.
- 외부 의존성은 CDN으로 로드: jQuery 1.12.4, SoundJS 0.6.2 (index.html 참고).
- 모듈 시스템 없음 — 모든 클래스/상수/전역 변수가 글로벌 스코프에 존재한다.

## 실행 방법

정적 파일 서버로 루트를 서빙한 뒤 브라우저에서 index.html을 연다. 예:

```
python -m http.server 8000
# 또는
npx serve .
```

참고: index.html의 `framework.js?<?PHP echo time(); ?>`는 PHP 호스팅용 캐시버스팅 코드라
정적 서버에서는 쿼리스트링이 리터럴로 전달될 뿐 동작에는 지장 없다.

서버 실행 (별도 저장소): `cd ..\shoot_game_server; npm install; node server.js`
클라이언트의 접속 주소는 `network_class.js` 상단의 `wsUri`가 자동 선택한다:
`localhost`/`127.0.0.1`에서 서빙하면 `ws://localhost:8080`(로컬 서버), 그 외에는
`wss://www.kimhwan.kr:8081`(운영 서버)로 접속한다.

## 부팅/스크립트 로딩 구조

1. `index.html` → `framework.js` 로드
2. `framework.js` 상단의 `requireScripts` 배열이 나머지 모든 `*_class.js` 파일을 `<head>`에 동적 삽입한다.
   **새 JS 파일을 추가하면 반드시 이 배열에도 등록해야 한다.**
3. `window.onload`에서 게임 캔버스 + UI 캔버스(겹쳐진 2장)를 생성하고
   `systemClass = new SystemClass(...)` → `systemClass.run()`으로 게임 루프 시작.

게임 루프(`system_class.js`의 `run()`): requestAnimationFrame 기반으로 매 프레임
`inputFrame()` → `playersFrame()` → `soundClass.frame()` → `graphicsClass.frame()` → `debugClass.frame()` 순서로 호출.

## 아키텍처

`SystemClass`(system_class.js)가 중앙 오케스트레이터다. 모든 하위 클래스를 생성·보유하고,
입력/네트워크/플레이어 이벤트를 생성자 안에서 전부 배선(wiring)한다.

```
SystemClass
 ├─ InputClass      키보드/마우스 상태 (키코드 상수도 input_class.js에 정의)
 ├─ NetworkClass    WebSocket 통신 (JSON {type, data} 프로토콜)
 ├─ ChatClass       채팅 입력/메시지 표시 (DOM 기반)
 ├─ SoundClass      SoundJS 래퍼, 위치 기반 볼륨/팬 계산
 ├─ ObjectClass     맵 위 오브젝트(벽 등)
 ├─ ItemManagerClass  서버 권위 아이템(메드킷/탄약) 보관·렌더링 (item_class.js)
 ├─ GraphicsClass   렌더링 총괄
 │   ├─ CameraClass            뷰박스/회전/카메라 제한
 │   ├─ MapClass(map_office_data)  타일맵 렌더링 + 히트박스/세그먼트 생성
 │   ├─ SightEffectClass       시야(라이팅) 효과 — lighting_class.js에 정의
 │   ├─ UserInterfaceClass     HUD (ui_class.js: InfoHUD, UserHUD, KillHUD, MinimapInterfaceClass)
 │   ├─ ParticleClass, WeatherClass(비활성), SurvivorCharacterClass(스프라이트)
 └─ players[]       id를 키로 쓰는 PlayerClass 맵 (배열을 맵처럼 사용)
```

`sprite_class.js`의 `NpcCharacterClass`는 미사용 예비 클래스다 (PvE 몬스터 기능용,
`images/Monster/skeleton`·`sound/monster` 에셋과 세트).

전역 인스턴스: `systemClass`(framework.js), `debugClass`(debug_class.js) — 여러 파일에서 직접 참조한다.

## 구현 패턴 (코드 수정 시 따를 것)

- **포맷팅**: Prettier 기본 설정(2-space)으로 통일되어 있다. 맵 데이터 파일
  (`map_office.js`, `map_data1.js`)은 포맷 대상에서 제외한다.
- **파일/클래스 명명**: 파일은 `snake_case_class.js`, 클래스는 `PascalCase + Class` 접미사
  (예: `player_class.js` → `PlayerClass`). 한 파일에 보조 클래스가 같이 있을 수 있다.
- **콜백 할당 패턴**: 이벤트는 EventEmitter가 아니라 인스턴스 프로퍼티에 함수를 직접 할당하는 방식.
  예: `this.networkClass.userconnected = function (...) {...}`. 호출하는 쪽은
  `if (this.userconnected) this.userconnected(...)`로 null 체크 후 호출. 배선은 대부분
  `SystemClass` 생성자에서 이루어진다.
- **`var self = this` 클로저** 패턴을 화살표 함수 대신 사용한다.
- **getter/setter 메서드**: 프로퍼티 직접 접근 대신 `getName()/setName()` 류 메서드 사용.
  setter는 값 변경 시 해당 `*changed` 콜백을 호출한다 (→ 본인 플레이어면 네트워크 전송으로 이어짐).
- **프레임 시간 보정**: `performance.now()` 기반 `timeRatio`(60fps 기준 배율)를 곱해 이동량 계산
  (player_class.js `frame()` 참고).
- **리소스 로딩**: 이미지/사운드는 비동기 로드 후 `isLoaded()` 플래그 확인.
  GraphicsClass.frame()이 모든 리소스 로드 전엔 "LOADING" 화면을 그린다.
- **Canvas 확장 메서드**: `extension_method.js`에서 `CanvasRenderingContext2D.prototype`에
  `roundedRect`, `drawText`(그림자 텍스트)를 추가해 사용한다.

## 네트워크 프로토콜 (서버와 동기화 필수)

- 메시지 형식: `JSON.stringify({ type, data })`. 수신은 `network_class.js`의 `onMessage` switch에서 분기.
- 주요 타입: `id`(접속 시 ID 할당), `user_init`, `user_connected/disconnected/count`,
  `user_position/speed/direction/weapon/character/name`, `user_shoot/melee_attack/reload`,
  `user_hp/die/kill/death`, `user_chat/chat_history`, `echo`(레이턴시 측정, 1초 주기),
  `item_list/item_spawn/item_picked/ammo_refill`(아이템), `round_info`(라운드 남은 시간).
- `user_shoot`의 `data.targetPoints`는 **배열**이다. 샷건은 펠릿 7개(`SHOTGUN_PELLET_COUNT`,
  클라·서버 동일 값 유지), 그 외 무기는 1개. 원격 사격 재현 시 `PlayerClass.shoot()`의
  3번째 인자(`presetTargets`)로 그대로 전달한다.
- `user_connected`의 `data.protectedMs`는 남은 스폰 무적 시간(ms). 클라이언트는
  `PlayerClass.setSpawnProtection()`으로 반영하고, 무적 시간 동안 피격 시각 효과를 생략한다.
  본인 무적은 `sendUserInit` 직후 `SPAWN_PROTECTION_DURATION`(system_class.js 상단, 서버와 동일 값)으로 설정.
- 아이템(메드킷/탄약 상자)은 전부 서버 권위: 클라이언트(`item_class.js`의 `ItemManagerClass`)는
  보관·렌더링만 하고 획득 판정은 서버가 한다. 탄약 보급은 `ammo_refill` 수신 시 `resetAmmo()`.
- `server_notice`(킬스트릭/라운드 공지)는 문자열이 아니라 `{key, params}`로 온다.
  `localeClass.getServerNoticeHtml()`이 현재 언어로 렌더링한다 (아래 다국어 항목 참고).

## 다국어 (locale_class.js)

- 게임 중 메시지(채팅 시스템 메시지, HUD 텍스트, 서버 공지)는 전역 `localeClass`를 통해 출력한다.
  기본 언어 영어(`en`), F7 키로 한국어(`ko`) 전환, 선택은 쿠키(`language`)에 저장.
- API: `get(key, params)` 캔버스용 일반 문자열 / `getHtml(key, params)` 채팅(innerHTML)용 —
  params(닉네임 등 유저 입력)를 escapeHtml 처리 / `getServerNoticeHtml(key, params)` 서버 공지용.
- 문자열 추가 시 `LOCALE_STRINGS`의 en/ko 양쪽에 같은 키를 넣는다. 현재 언어에 없으면 영어로,
  영어에도 없으면 키 그대로 폴백된다. 템플릿 플레이스홀더는 `{name}` 형식.
- 서버가 새 공지 종류를 추가하면(서버 rounds.js 등) 클라이언트 `LOCALE_STRINGS`에도 키를 추가해야 한다.
- **클라이언트 권위(client-authoritative)** 구조: 본인 플레이어의 이동/사격을 로컬에서 계산해 서버로
  전송하고, 서버는 다른 클라이언트에 중계한다. 수신 핸들러는 `id !== currentId`일 때만 원격 플레이어에
  적용한다. 피격 판정(레이-세그먼트/원 교차)도 클라이언트(`SystemClass.updateShootTarget/
  updateShootIntersection`)에서 수행한다.
- 연결 끊김 시 1초 간격 자동 재접속(`onClose` → `initializeWebSocket`).
- 메시지 타입을 추가/변경하면 서버 저장소의 `websocket-server.js`도 함께 수정해야 한다.

## 맵 데이터

- 맵은 전역 const 객체로 정의: `map_office.js`의 `map_office_data`(현재 사용 중),
  `map_data1.js`의 `map_data1`(미사용 예비). GraphicsClass 생성자에서 `new MapClass(map_office_data)`로 선택.
- 형식: `{ name, tile_src, width, height, tile_width, tile_height, wall_tiles: [...], data: [타일 인덱스 1차원 배열] }`
- `MapClass`가 생성 시 `wall_tiles` 기준으로 충돌 히트박스와 시야/사격 레이캐스트용 세그먼트를 미리 계산한다.
- 서버 저장소의 `map-helper.js`가 맵 관련 보조 도구다.

## 디버그

게임 내 F1~F9 키로 디버그 토글 (debug_class.js, system_class.js 참고):
F1 디버그 정보(FPS/레이턴시), F2 디버그 그래픽, F3 포인터락 모드, F4 음소거,
F6 저화질 맵, F7 언어 전환(en/ko), F8 닉네임 변경, F9 imageSmoothing 토글.
닉네임은 쿠키(`user_name`)에, 언어는 쿠키(`language`)에 저장된다.
