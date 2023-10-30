class LightingClass {
  constructor(screenWidth, screenHeight) {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
  }

  drawLighting(drawingContext, players, cameraClass, objectClass, mapClass) {
    //this.sightEffectClass.drawSightEffect(drawingContext, players, cameraClass, objectClass, mapClass);
  }
}

class SightEffectClass {
  constructor(screenWidth, screenHeight) {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;

    this.sightCanvas = document.createElement("canvas");
    this.sightCanvas.width = screenWidth;
    this.sightCanvas.height = screenHeight;
    this.sightDrawingContext = this.sightCanvas.getContext("2d", {
      alpha: false,
    });
  }

  drawSightLighting(drawingContext) {
    if (!debugClass.debugGraphicsVisible) {
      drawingContext.save();
      drawingContext.resetTransform();
      drawingContext.globalCompositeOperation = "multiply";
      drawingContext.drawImage(this.sightCanvas, 0, 0);
      drawingContext.restore();
    } else {
      this.drawDebugSightInfo(
        drawingContext,
        this.sightCenterX,
        this.sightCenterY,
        this.sightIntersects
      );
    }
  }

  clipSight(drawingContext) {
    if (this.sightIntersects) {
      drawingContext.beginPath();
      drawingContext.moveTo(this.sightCenterX, this.sightCenterY);
      for (let j = 0; j < this.sightIntersects.length; j++) {
        var intersect = this.sightIntersects[j];
        drawingContext.lineTo(intersect.x, intersect.y);
      }
      drawingContext.clip();
    }
  }

  updateSight(players, cameraClass, objectClass, mapClass) {
    this.sightDrawingContext.save();
    if (cameraClass.getRotate() !== 0) {
      this.sightDrawingContext.translate(
        this.screenWidth / 2,
        this.screenHeight / 2
      );
      this.sightDrawingContext.rotate(cameraClass.getRotate());
      this.sightDrawingContext.translate(
        -this.screenWidth / 2,
        -this.screenHeight / 2
      );
    }

    const range = 700;
    const darkness = 0.9;

    this.sightDrawingContext.globalCompositeOperation = "copy";
    this.sightDrawingContext.beginPath();
    this.sightDrawingContext.fillStyle = "rgb(20, 20, 20, " + darkness + ")";
    this.sightDrawingContext.arc(
      this.screenWidth / 2,
      this.screenHeight / 2,
      cameraClass.circumscriptionRadius,
      0,
      Math.PI * 2,
      false
    );
    this.sightDrawingContext.fill();
    this.sightDrawingContext.globalCompositeOperation = "lighter";

    var segments = [];
    if (objectClass) {
      const seg = objectClass.getSegments(cameraClass, range * 2);
      if (seg) {
        segments = segments.concat(seg);
      }
    }
    if (mapClass) {
      const seg = mapClass.getSegments(cameraClass, range * 2);
      if (seg) {
        segments = segments.concat(seg);
      }
    }

    if (players) {
      for (let i = 0; i < players.length; i++) {
        const player = players[players[i]];
        if (player && !player.isOtherPlayer()) {
          var x = player.getCenterX() - cameraClass.getViewboxLeft();
          var y = player.getCenterY() - cameraClass.getViewboxTop();

          const userLightRadius =
            Math.max(player.getWidth(), player.getHeight()) * 2;
          const characterLight = this.sightDrawingContext.createRadialGradient(
            x,
            y,
            0,
            x,
            y,
            userLightRadius
          );
          characterLight.addColorStop(
            0,
            "rgba(255, 255, 220," + darkness + ")"
          );
          characterLight.addColorStop(1, "rgba(255, 255, 220, 0)");

          this.sightDrawingContext.beginPath();
          this.sightDrawingContext.fillStyle = characterLight;
          this.sightDrawingContext.rect(
            x - userLightRadius,
            y - userLightRadius,
            userLightRadius * 2,
            userLightRadius * 2
          );
          this.sightDrawingContext.fill();

          var lightDegreeRange = 55;
          this.sightDrawingContext.save();

          if (segments && segments.length > 0) {
            this.sightIntersects = this.getSightPolygon(
              player,
              cameraClass,
              segments,
              lightDegreeRange
            );
            this.sightCenterX = x;
            this.sightCenterY = y;

            this.sightDrawingContext.beginPath();
            this.sightDrawingContext.moveTo(x, y);
            for (let j = 0; j < this.sightIntersects.length; j++) {
              var intersect = this.sightIntersects[j];
              this.sightDrawingContext.lineTo(intersect.x, intersect.y);
            }
            this.sightDrawingContext.clip();
          }

          var light = this.sightDrawingContext.createRadialGradient(
            x,
            y,
            0,
            x,
            y,
            range
          );
          light.addColorStop(0, "rgba(150, 150, 140," + darkness + ")");
          light.addColorStop(1, "rgba(255, 255, 200, 0)");

          this.sightDrawingContext.fillStyle = light;
          this.sightDrawingContext.beginPath();
          this.sightDrawingContext.moveTo(x, y);
          this.sightDrawingContext.arc(
            x,
            y,
            range,
            ((-lightDegreeRange + player.getDirection()) * Math.PI) / 180,
            ((lightDegreeRange + player.getDirection()) * Math.PI) / 180,
            false
          );
          this.sightDrawingContext.closePath();
          this.sightDrawingContext.fill();

          this.sightDrawingContext.restore();

          if (
            player.getStatus() === "shoot" &&
            player.getCurrentStatusFrame() == 0
          ) {
            const shootInfo = player.getShootInfo();
            if (shootInfo) {
              const muzzleX = shootInfo.muzzle.x - cameraClass.getViewboxLeft();
              const muzzleY = shootInfo.muzzle.y - cameraClass.getViewboxTop();

              var bulletLight = this.sightDrawingContext.createRadialGradient(
                muzzleX,
                muzzleY,
                0,
                muzzleX,
                muzzleY,
                150
              );
              bulletLight.addColorStop(
                0,
                "rgba(150, 150, 150," + darkness + ")"
              );
              bulletLight.addColorStop(1, "rgba(255, 255, 170, 0)");

              this.sightDrawingContext.fillStyle = bulletLight;
              this.sightDrawingContext.beginPath();
              this.sightDrawingContext.moveTo(muzzleX, muzzleY);
              this.sightDrawingContext.arc(
                muzzleX,
                muzzleY,
                150,
                0,
                Math.PI * 2,
                false
              );
              this.sightDrawingContext.closePath();
              this.sightDrawingContext.fill();
            }
          }
        }
      }
    }

    this.sightDrawingContext.restore();
  }

  /*
    drawSightEffect(drawingContext, players, cameraClass, objectClass, mapClass) {

        this.sightDrawingContext.save();
        if(cameraClass.getRotate() !== 0) {
            this.sightDrawingContext.translate(this.screenWidth / 2, this.screenHeight / 2);
            this.sightDrawingContext.rotate(cameraClass.getRotate());
            this.sightDrawingContext.translate(-this.screenWidth / 2, -this.screenHeight / 2);
        }

        const range = 350;
        //const darkness = 0.95;
        const darkness = 0.90;

        this.sightDrawingContext.globalCompositeOperation = 'copy';
        this.sightDrawingContext.beginPath();
        this.sightDrawingContext.fillStyle = 'rgb(0, 0, 0, ' + darkness + ')';
        this.sightDrawingContext.arc(this.screenWidth / 2, this.screenHeight / 2, cameraClass.circumscriptionRadius, 0, Math.PI * 2, false);
        this.sightDrawingContext.fill();
        this.sightDrawingContext.globalCompositeOperation = 'lighter';

        var segments = [];
        if(objectClass) {
            const seg = objectClass.getSegments(cameraClass, range * 2);
            if(seg) {
                segments.concat(seg);
            }
        }
        if(mapClass) {
            const seg = mapClass.getSegments(cameraClass, range * 2);
            if(seg) {
                segments.concat(seg);

                segments = seg;
            }
        }
        if(segments && segments.length > 0) {
            segments.push({ a: { x: -range, y: -range }, b: { x: this.screenWidth + range, y: -range } });
            segments.push({ a: { x: this.screenWidth + range, y: -range }, b: { x: this.screenWidth + range, y: this.screenHeight + range } });
            segments.push({ a: { x: -range, y: this.screenHeight + range}, b: { x: this.screenWidth + range, y: this.screenHeight + range } });
            segments.push({ a: { x: -range, y: -range }, b: { x: -range, y: this.screenHeight + range } });
        }

        if (players) {
            for (var i = 0; i < players.length; i++) {
                const player = players[players[i]];
                if (player) {
                    var x = player.getCenterX() - cameraClass.getViewboxLeft();
                    var y = player.getCenterY() - cameraClass.getViewboxTop();

                    if (darkness > 0.4) {
                        const userLightRadius = Math.max(player.getWidth(), player.getHeight()) * 2;
                        var characterLight = this.sightDrawingContext.createRadialGradient(x, y, 0, x, y, userLightRadius);
                        characterLight.addColorStop(0, 'rgba(255, 255, 255,' + darkness + ')');
                        characterLight.addColorStop(1, 'rgba(255, 255, 255, 0)');

                        this.sightDrawingContext.beginPath();
                        this.sightDrawingContext.fillStyle = characterLight;
                        this.sightDrawingContext.rect(x - userLightRadius, y - userLightRadius, userLightRadius * 2, userLightRadius * 2);
                        this.sightDrawingContext.fill();

                        if (player.getWeapon() === 'flashlight' || player.getWeapon() === 'handgun' || player.getWeapon() === 'rifle' || player.getWeapon() === 'shotgun') {
                            var lightDegreeRange = 10;
                            if(player.getWeapon() === 'flashlight') {
                                lightDegreeRange = 25;
                            }

                            this.sightDrawingContext.save();

                            if(segments && segments.length > 0) {
                                var intersects = this.getSightPolygon(player, cameraClass, segments, lightDegreeRange);
                                this.sightDrawingContext.beginPath();
                                this.sightDrawingContext.moveTo(x, y);
                                for (var j = 0; j < intersects.length; j++) {
                                    var intersect = intersects[j];
                                    this.sightDrawingContext.lineTo(intersect.x, intersect.y);
                                }
                                this.sightDrawingContext.clip();
                                if(debugClass.debugGraphicsVisible) {
                                    this.drawDebugSightInfo(drawingContext, x, y, intersects);
                                }
                            }
                            
                            var light = this.sightDrawingContext.createRadialGradient(x, y, 0, x, y, range - (Math.random() * 15));
                            light.addColorStop(0, 'rgba(100, 100, 100,' + darkness + ')');
                            light.addColorStop(1, 'rgba(255, 255, 255, 0)');

                            this.sightDrawingContext.fillStyle = light;
                            this.sightDrawingContext.beginPath();
                            this.sightDrawingContext.moveTo(x, y);
                            this.sightDrawingContext.arc(x, y, range, (-lightDegreeRange + Math.random() + player.getDirection()) * Math.PI / 180, (lightDegreeRange + Math.random() + player.getDirection()) * Math.PI / 180, false);
                            this.sightDrawingContext.closePath();
                            this.sightDrawingContext.fill();

                            this.sightDrawingContext.restore();

                            if(player.getStatus() === 'shoot' && player.getCurrentStatusFrame() == 0) {
                                const shootInfo = player.getShootInfo();
                                if(shootInfo) {
                                    const muzzleX = shootInfo.muzzle.x - cameraClass.getViewboxLeft();
                                    const muzzleY = shootInfo.muzzle.y - cameraClass.getViewboxTop();

                                    var bulletLight = this.sightDrawingContext.createRadialGradient(muzzleX, muzzleY, 0, muzzleX, muzzleY, 150);
                                    bulletLight.addColorStop(0, 'rgba(255, 255, 255,' + darkness + ')');
                                    bulletLight.addColorStop(1, 'rgba(255, 255, 255, 0)');

                                    this.sightDrawingContext.fillStyle = bulletLight;
                                    this.sightDrawingContext.beginPath();
                                    this.sightDrawingContext.moveTo(muzzleX, muzzleY);
                                    this.sightDrawingContext.arc(muzzleX, muzzleY, 150, 0, Math.PI * 2, false);
                                    this.sightDrawingContext.closePath();
                                    this.sightDrawingContext.fill();
                                }
                            }
                        }
                    }
                }
            }
        }

        if(!debugClass.debugGraphicsVisible) {
            drawingContext.save();
            drawingContext.resetTransform();
            drawingContext.globalCompositeOperation = 'multiply';
            drawingContext.drawImage(this.sightCanvas, 0, 0);
            drawingContext.restore();
        }

        this.sightDrawingContext.restore();
    }
    */

  drawDebugSightInfo(drawingContext, x, y, intersects) {
    // sight polygon
    drawingContext.fillStyle = "rgba(255, 255, 0, 0.3)";
    drawingContext.beginPath();
    drawingContext.moveTo(x, y);
    for (let j = 0; j < intersects.length; j++) {
      var intersect = intersects[j];
      drawingContext.lineTo(intersect.x, intersect.y);
    }
    drawingContext.fill();

    // debug line
    drawingContext.strokeStyle = "rgba(80, 80, 80, 0.3)";
    for (let j = 0; j < intersects.length; j++) {
      var intersect = intersects[j];
      drawingContext.beginPath();
      drawingContext.moveTo(x, y);
      drawingContext.lineTo(intersect.x, intersect.y);
      drawingContext.stroke();
    }

    drawingContext.fillStyle = "rgba(255, 0, 0, 0.3)";
    for (let j = 0; j < intersects.length; j++) {
      var intersect = intersects[j];
      drawingContext.beginPath();
      drawingContext.arc(intersect.x, intersect.y, 2, 0, 2 * Math.PI, false);
      drawingContext.fill();
    }
  }

  getSightPolygon(player, cameraClass, segments, lightDegreeRange) {
    function getRayIntersection(ray, segment) {
      // RAY in parametric: Point + Direction*T1
      var r_px = ray.a.x;
      var r_py = ray.a.y;
      var r_dx = ray.b.x - ray.a.x;
      var r_dy = ray.b.y - ray.a.y;

      // SEGMENT in parametric: Point + Direction*T2
      var s_px = segment.a.x;
      var s_py = segment.a.y;
      var s_dx = segment.b.x - segment.a.x;
      var s_dy = segment.b.y - segment.a.y;

      // 두 선이 평행하다면 접점 존재하지 않음.
      var r_mag = Math.sqrt(r_dx * r_dx + r_dy * r_dy);
      var s_mag = Math.sqrt(s_dx * s_dx + s_dy * s_dy);
      if (r_dx / r_mag == s_dx / s_mag && r_dy / r_mag == s_dy / s_mag) {
        // 기울기 같음
        return null;
      }

      // SOLVE FOR T1 & T2
      var T2 =
        (r_dx * (s_py - r_py) + r_dy * (r_px - s_px)) /
        (s_dx * r_dy - s_dy * r_dx);
      var T1 = (s_px + s_dx * T2 - r_px) / r_dx;

      // Must be within parametic whatevers for RAY/SEGMENT
      if (T1 < 0) return null;
      if (T2 < 0 || T2 > 1) return null;

      // Return the POINT OF INTERSECTION
      return {
        x: r_px + r_dx * T1,
        y: r_py + r_dy * T1,
        param: T1,
      };
    }

    var rayX = player.getCenterX() - cameraClass.getViewboxLeft();
    var rayY = player.getCenterY() - cameraClass.getViewboxTop();

    // Get all unique points
    var points = (function (segments) {
      var a = [];
      segments.forEach(function (seg) {
        a.push(seg.a, seg.b);
      });
      return a;
    })(segments);
    var uniquePoints = (function (points) {
      var set = {};
      return points.filter(function (p) {
        var key = p.x + "," + p.y;
        if (key in set) {
          return false;
        } else {
          set[key] = true;
          return true;
        }
      });
    })(points);

    // Get all angles
    var uniqueAngles = [];
    for (let j = 0; j < uniquePoints.length; j++) {
      var uniquePoint = uniquePoints[j];
      var angle = Math.atan2(uniquePoint.y - rayY, uniquePoint.x - rayX);
      //uniquePoint.angle = angle;
      uniqueAngles.push(angle - 0.00001, angle, angle + 0.00001);
    }

    var postEvent = undefined;

    var startAngle =
      (Math.PI / 180) * (-lightDegreeRange + (player.getDirection() % 360));
    var endAngle =
      (Math.PI / 180) * (lightDegreeRange + (player.getDirection() % 360));
    if (startAngle < -Math.PI) {
      startAngle += Math.PI * 2;
      postEvent = function (intersects) {
        const offset = Math.PI * 2;
        for (let j = 0; j < intersects.length; j++) {
          if (intersects[j].angle > 0) {
            intersects[j].angle -= offset;
          }
        }
      };
    }
    if (endAngle > Math.PI) {
      endAngle -= Math.PI * 2;
      postEvent = function (intersects) {
        const offset = Math.PI * 2;
        for (let j = 0; j < intersects.length; j++) {
          if (intersects[j].angle < 0) {
            intersects[j].angle += offset;
          }
        }
      };
    }

    uniqueAngles.push(startAngle);
    uniqueAngles.push(endAngle);

    var intersects = [];
    for (let j = 0; j < uniqueAngles.length; j++) {
      var angle = uniqueAngles[j];

      if (
        startAngle < endAngle
          ? startAngle <= angle && angle <= endAngle
          : startAngle <= angle || angle <= endAngle
      ) {
        var dx = Math.cos(angle);
        var dy = Math.sin(angle);

        var ray = {
          a: { x: rayX, y: rayY },
          b: { x: rayX + dx, y: rayY + dy },
        };

        var closestIntersect = null;
        for (let i = 0; i < segments.length; i++) {
          var intersect = getRayIntersection(ray, segments[i]);
          if (!intersect) continue;
          if (!closestIntersect || intersect.param < closestIntersect.param) {
            closestIntersect = intersect;
          }
        }
        if (!closestIntersect) continue;
        closestIntersect.angle = angle;
        intersects.push(closestIntersect);
      }
    }
    if (postEvent) {
      postEvent(intersects);
    }
    intersects = intersects.sort(function (a, b) {
      return a.angle - b.angle;
    });

    return intersects;
  }
}
