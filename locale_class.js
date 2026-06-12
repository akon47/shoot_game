// 게임 중 표시되는 클라이언트 메시지의 다국어 처리.
// 기본 언어는 영어(en)이며 F7 키로 한국어(ko)와 전환한다. 선택은 쿠키에 저장된다.
// 서버 공지는 server_notice 메시지(key + params)로 받아 클라이언트가 현재 언어로 렌더링한다.

const LOCALE_COOKIE_NAME = "language";

const LOCALE_STRINGS = {
  en: {
    // 시스템/채팅 메시지
    connection_lost: "The connection with the server has been lost.",
    reconnecting: "Attempting to connect to the server. ({count})",
    connected: "You are connected.",
    player_joined: "[{name}] has connected.",
    player_left: "[{name}] has disconnected.",
    pickup_medkit: "Used a medkit. (HP restored)",
    pickup_ammo: "Ammo resupplied!",
    prompt_enter_name: "Enter a new name",
    language_changed: "Language: English",

    // HUD
    players_online: "{count} players are online",
    round_label: "ROUND",
    kill_label: "Kill",
    death_label: "Death",
    killhud_kill: "KILL",

    // 서버 공지 (server_notice)
    killstreak_3: "[{name}] is on a 3 kill streak! 🔥",
    killstreak_5: "[{name}] is on a 5 kill streak! Rampage! 🔥🔥",
    killstreak_7: "[{name}] is on a 7 kill streak! Unstoppable! ⚡",
    killstreak_10: "[{name}] is on a 10 kill streak! Legendary! 👑",
    killstreak_generic: "[{name}] is on a {streak} kill streak!",
    streak_stopped: "[{killer}] ended [{victim}]'s {streak} kill streak!",
    round_end_winner:
      "🏆 Round over! Winner: [{name}] ({kill} kills / {death} deaths)",
    round_end: "Round over!",
    round_start:
      "A new round has started! The winner will be announced in {minutes} minutes.",
    map_changed: "Map changed: {name}",
  },
  ko: {
    // 시스템/채팅 메시지
    connection_lost: "서버와의 연결이 끊어졌습니다.",
    reconnecting: "서버에 다시 연결을 시도합니다. ({count})",
    connected: "접속되었습니다.",
    player_joined: "[{name}] 님이 접속했습니다.",
    player_left: "[{name}] 님이 나갔습니다.",
    pickup_medkit: "메드킷을 사용했습니다. (HP 회복)",
    pickup_ammo: "탄약을 보급했습니다.",
    prompt_enter_name: "새 닉네임을 입력하세요",
    language_changed: "언어: 한국어",

    // HUD
    players_online: "접속자 {count}명",
    round_label: "ROUND",
    kill_label: "킬",
    death_label: "데스",
    killhud_kill: "킬",

    // 서버 공지 (server_notice)
    killstreak_3: "[{name}] 3연속 킬! 🔥",
    killstreak_5: "[{name}] 5연속 킬! 폭주 중입니다! 🔥🔥",
    killstreak_7: "[{name}] 7연속 킬! 막을 수 없습니다! ⚡",
    killstreak_10: "[{name}] 10연속 킬! 전설입니다! 👑",
    killstreak_generic: "[{name}] {streak}연속 킬!",
    streak_stopped:
      "[{killer}]님이 [{victim}]의 {streak}연속 킬 행진을 끝냈습니다!",
    round_end_winner: "🏆 라운드 종료! 우승: [{name}] ({kill}킬 / {death}데스)",
    round_end: "라운드 종료!",
    round_start: "새 라운드 시작! {minutes}분 후 우승자가 발표됩니다.",
    map_changed: "맵이 변경되었습니다: {name}",
  },
};

class LocaleClass {
  constructor() {
    const saved = getCookie(LOCALE_COOKIE_NAME);
    this.language = LOCALE_STRINGS[saved] ? saved : "en";
  }

  getLanguage() {
    return this.language;
  }

  setLanguage(language) {
    if (LOCALE_STRINGS[language]) {
      this.language = language;
      setCookie(LOCALE_COOKIE_NAME, language);
    }
  }

  toggleLanguage() {
    this.setLanguage(this.language === "en" ? "ko" : "en");
    return this.language;
  }

  // 캔버스 등 HTML 이스케이프가 필요 없는 곳에 쓰는 일반 문자열
  get(key, params) {
    return this.format(this.getTemplate(key), params, false);
  }

  // 채팅창(innerHTML)에 삽입할 문자열 — 파라미터(닉네임 등 유저 입력)를 이스케이프한다
  getHtml(key, params) {
    return this.format(this.getTemplate(key), params, true);
  }

  // 서버 공지(server_notice)의 key/params 를 현재 언어의 HTML 문자열로 변환
  getServerNoticeHtml(key, params) {
    let stringKey = key;
    if (key === "killstreak") {
      stringKey = "killstreak_" + (params ? params.streak : "");
      if (!this.findTemplate(stringKey)) {
        stringKey = "killstreak_generic";
      }
    }
    return this.getHtml(stringKey, params);
  }

  findTemplate(key) {
    return LOCALE_STRINGS[this.language][key] || LOCALE_STRINGS.en[key];
  }

  // 현재 언어에 없으면 영어로, 영어에도 없으면 key 그대로 반환
  getTemplate(key) {
    return this.findTemplate(key) || key;
  }

  format(template, params, escapeParams) {
    if (!params) {
      return template;
    }
    let result = template;
    const names = Object.keys(params);
    for (let i = 0; i < names.length; i++) {
      let value = String(params[names[i]]);
      if (escapeParams) {
        value = escapeHtml(value);
      }
      result = result.split("{" + names[i] + "}").join(value);
    }
    return result;
  }
}

let localeClass = new LocaleClass();
