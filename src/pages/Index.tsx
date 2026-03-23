import { useState } from "react";
import { TextInput } from "@/components/TextInput";
import { TeleprompterDisplay } from "@/components/TeleprompterDisplay";

const Index = () => {
  const [text, setText] = useState("");
  const [isPrompting, setIsPrompting] = useState(false);

  if (isPrompting && text.trim()) {
    return (
      <TeleprompterDisplay
        text={text}
        onExit={() => setIsPrompting(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12">
      <TextInput
        text={text}
        onTextChange={setText}
        onStart={() => setIsPrompting(true)}
      />
    </div>
  );
};

export default Index;
