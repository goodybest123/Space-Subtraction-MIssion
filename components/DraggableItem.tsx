import React from 'react';

export const DraggableItem: React.FC<{ type: 'tens' | 'ones'; id: string }> = ({ type, id }) => {
  const onDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('application/json', JSON.stringify({ type, id }));
    const img = e.currentTarget.cloneNode(true) as HTMLElement;
    img.style.position = 'absolute';
    img.style.left = '-1000px';
    document.body.appendChild(img);
    e.dataTransfer.setDragImage(img, 10, 10);
    setTimeout(() => document.body.removeChild(img), 0);
  };

  if (type === 'tens') {
    return (
      <div
        className="w-[110px] h-[44px] rounded-lg bg-gradient-to-r from-[#8b5cf6] to-[#a88bff] shadow-[0_6px_18px_rgba(139,92,246,0.28)] flex items-center justify-center text-[#081224] font-extrabold cursor-grab select-none text-lg"
        draggable="true"
        onDragStart={onDragStart}
        role="button"
        aria-label="Tens rod, value 10"
      >
        10
      </div>
    );
  }

  return (
    <div
      className="w-[44px] h-[44px] rounded-full bg-gradient-to-b from-[#00f0ff] to-[#00c8ff] shadow-[0_8px_20px_rgba(0,240,255,0.14)] flex items-center justify-center text-[#021228] font-bold cursor-grab select-none text-lg"
      draggable="true"
      onDragStart={onDragStart}
      role="button"
      aria-label="Ones orb, value 1"
    >
      1
    </div>
  );
};