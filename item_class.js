// 서버가 스폰/회수를 관리하는 맵 위 아이템(메드킷/탄약 상자)을 보관하고 그린다.
// 서버 메시지: item_list(접속 시 스냅샷), item_spawn, item_picked
class ItemManagerClass {
  constructor() {
    this.items = {};
  }

  setItems(items) {
    this.items = {};
    if (items) {
      for (let i = 0; i < items.length; i++) {
        this.items[items[i].id] = items[i];
      }
    }
  }

  addItem(item) {
    if (item) {
      this.items[item.id] = item;
    }
  }

  removeItem(itemId) {
    delete this.items[itemId];
  }

  drawItems(drawingContext, cameraClass) {
    const now = performance.now();
    const itemIds = Object.keys(this.items);
    for (let i = 0; i < itemIds.length; i++) {
      const item = this.items[itemIds[i]];
      if (!item) {
        continue;
      }
      if (!cameraClass.containsBox(item.x, item.y, 32, 32)) {
        continue;
      }
      // 아이템마다 위상이 다른 둥실거림 효과
      const bob = Math.sin(now / 250 + item.x * 0.1) * 2;
      const centerX = item.x + 16 - cameraClass.getViewboxLeft();
      const centerY = item.y + 16 - cameraClass.getViewboxTop() + bob;

      switch (item.type) {
        case "medkit":
          this.drawMedkit(drawingContext, centerX, centerY);
          break;
        case "ammo":
          this.drawAmmoBox(drawingContext, centerX, centerY);
          break;
      }
    }
  }

  drawMedkit(drawingContext, centerX, centerY) {
    const width = 22;
    const height = 16;

    drawingContext.beginPath();
    drawingContext.fillStyle = "#F5F5F5";
    drawingContext.roundedRect(
      centerX - width / 2,
      centerY - height / 2,
      width,
      height,
      3,
    );
    drawingContext.fill();

    drawingContext.beginPath();
    drawingContext.fillStyle = "#E03030";
    drawingContext.rect(centerX - 2, centerY - 5, 4, 10);
    drawingContext.rect(centerX - 5, centerY - 2, 10, 4);
    drawingContext.fill();
  }

  drawAmmoBox(drawingContext, centerX, centerY) {
    const width = 22;
    const height = 14;

    drawingContext.beginPath();
    drawingContext.fillStyle = "#5C4A1E";
    drawingContext.roundedRect(
      centerX - width / 2,
      centerY - height / 2,
      width,
      height,
      2,
    );
    drawingContext.fill();

    // 탄약(총알 모양) 3개
    drawingContext.fillStyle = "#E8C547";
    for (let i = -1; i <= 1; i++) {
      drawingContext.beginPath();
      drawingContext.rect(centerX + i * 5 - 1.5, centerY - 4, 3, 8);
      drawingContext.fill();
      drawingContext.beginPath();
      drawingContext.arc(centerX + i * 5, centerY - 4, 1.5, Math.PI, 0, false);
      drawingContext.fill();
    }
  }
}
