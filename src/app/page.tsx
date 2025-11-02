"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { useState } from "react";

export default function Home() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmit = async () => {
    const { data, error } = await authClient.signUp.email(
      {
        email, // user email address
        password, // user password -> min 8 characters by default
        name, // user display name
      },
      {
        onSuccess: (ctx) => {
          console.log("ctx", ctx);
        },
        onError: (ctx) => {
          // display the error message
          alert(ctx.error.message);
        },
      }
    );

    console.log("data", data);
  };
  return (
    <div className="px-100 pt-10 flex flex-col gap-4">
      <Input
        placeholder="Enter your name"
        className=""
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        placeholder="Enter your email"
        className=""
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        placeholder="Enter your password"
        type="password"
        className=""
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button onClick={onSubmit}>Submit</Button>
    </div>
  );
}
