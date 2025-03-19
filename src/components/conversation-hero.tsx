import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const ConversationHero = ({
  name = "Name",
  image,
}: {
  name?: string;
  image?: string;
}) => {
  const avatarFallBack = name.charAt(0).toUpperCase();
  const avatarOptimizedImageLink = image
    ? `/api/image-proxy?url=${encodeURIComponent(image)}&w=100`
    : image;
  return (
    <div className="mt-[88px] mx-5 mb-4 ">
      <div className="flex items-center gap-x-1 mb-2">
        <Avatar className="size-14 mr-2">
          <AvatarImage src={avatarOptimizedImageLink} />
          <AvatarFallback>{avatarFallBack}</AvatarFallback>
        </Avatar>
        <p className="text-2xl font-bold"> {name}</p>
      </div>
      <p className="font-normal to-slate-800 mb-4">
        This is conversation is just between you and <strong>{name}</strong>
      </p>
    </div>
  );
};

export default ConversationHero;
