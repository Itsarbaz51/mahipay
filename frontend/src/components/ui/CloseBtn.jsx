import { X } from "lucide-react";

function CloseBtn({ isClose }) {
  return (
    <div
      onClick={isClose}
      className="bg-black/10 p-1 h-fit rounded duration-300 cursor-pointer hover:bg-black/15 "
    >
      <X />
    </div>
  );
}

export default CloseBtn;
