export function mapBoxContain(
  box:{x:number;y:number;width:number;height:number},
  imgW:number,imgH:number,viewW:number,viewH:number
){
  const scale = Math.min(viewW/imgW, viewH/imgH);
  const drawnW = imgW*scale, drawnH = imgH*scale;
  const ox = (viewW - drawnW)/2, oy = (viewH - drawnH)/2;
  return {
    left: ox + box.x*drawnW,
    top: oy + box.y*drawnH,
    width: box.width*drawnW,
    height: box.height*drawnH
  };
}

export function mapBoxCover(
  box:{x:number;y:number;width:number;height:number},
  imgW:number,imgH:number,viewW:number,viewH:number
){
  const scale = Math.max(viewW/imgW, viewH/imgH);
  const drawnW = imgW*scale, drawnH = imgH*scale;
  const ox = (viewW - drawnW)/2, oy = (viewH - drawnH)/2;
  return {
    left: ox + box.x*drawnW,
    top: oy + box.y*drawnH,
    width: box.width*drawnW,
    height: box.height*drawnH
  };
}
