CanvasRenderingContext2D.prototype.roundedRect = function(x, y, width, height, radius) {
    this.save();
    this.translate(x, y);
    this.moveTo(width / 2, 0);
    this.arcTo(width, 0, width, height, Math.min(height / 2, radius));
    this.arcTo(width, height, 0, height, Math.min(width / 2, radius));
    this.arcTo(0, height, 0, 0, Math.min(height / 2, radius));
    this.arcTo(0, 0, radius, 0, Math.min(width / 2, radius));
    this.lineTo(width / 2, 0);
    this.restore();
}


CanvasRenderingContext2D.prototype.drawText = function drawText(font, text, x, y) {
	if(text) {
		if(font) {
			this.font = font;
		}
		this.fillStyle = "black";
		this.fillText(text, x + 1, y + 1);
		this.fillStyle = "white";
        this.fillText(text, x, y);
	}
}