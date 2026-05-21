"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { Progress } from "./progress"; // Assuming shadcn progress exists, if not we'll just make a div. Wait, the frontend has a lot of components, but let's use a standard div for the progress bar to be safe and customizable.

interface PasswordStrengthProps {
  password?: string;
  confirmPassword?: string;
}

export function PasswordStrength({ password = "", confirmPassword = "" }: PasswordStrengthProps) {
  const [level, setLevel] = useState(0);
  const [label, setLabel] = useState("");
  const [color, setColor] = useState("bg-zinc-200 dark:bg-zinc-800");

  const rules = [
    { id: "length", text: "At least 8 characters", valid: password.length >= 8 },
    { id: "upper", text: "At least 1 uppercase letter", valid: /[A-Z]/.test(password) },
    { id: "lower", text: "At least 1 lowercase letter", valid: /[a-z]/.test(password) },
    { id: "num", text: "At least 1 number", valid: /[0-9]/.test(password) },
    { id: "special", text: "At least 1 special character", valid: /[^A-Za-z0-9]/.test(password) },
  ];

  const matchRule = {
    id: "match",
    text: "Passwords must match",
    valid: password.length > 0 && confirmPassword.length > 0 && password === confirmPassword,
  };

  useEffect(() => {
    if (!password) {
      setLevel(0);
      setLabel("");
      setColor("bg-zinc-200 dark:bg-zinc-800");
      return;
    }

    const passedRules = rules.filter((r) => r.valid).length;
    
    if (passedRules <= 2) {
      setLevel(1);
      setLabel("Weak");
      setColor("bg-red-500");
    } else if (passedRules === 3) {
      setLevel(2);
      setLabel("Fair");
      setColor("bg-orange-500");
    } else if (passedRules === 4) {
      setLevel(3);
      setLabel("Good");
      setColor("bg-yellow-500");
    } else {
      setLevel(4);
      setLabel("Strong");
      setColor("bg-green-500");
    }
  }, [password]);

  return (
    <div className="mt-4 space-y-3">
      {/* 4 Segmented Bars */}
      <div className="space-y-2">
        <div className="flex gap-1">
          {[1, 2, 3, 4].map((barLevel) => (
            <div
              key={barLevel}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                level >= barLevel ? color : "bg-zinc-200 dark:bg-zinc-800"
              }`}
            />
          ))}
        </div>
        <div className="text-sm font-medium">
          {password ? (
            <span className={color.replace("bg-", "text-")}>{label}</span>
          ) : (
            <span className="text-muted-foreground">Password strength</span>
          )}
        </div>
      </div>

      {/* Rules Checklist */}
      <ul className="space-y-1.5 text-sm">
        {rules.map((rule) => (
          <li key={rule.id} className="flex items-center gap-2">
            {rule.valid ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <X className="h-4 w-4 text-red-500" />
            )}
            <span className={rule.valid ? "text-green-500" : "text-red-500"}>
              {rule.text}
            </span>
          </li>
        ))}
        {confirmPassword !== undefined && (
          <li className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
            {matchRule.valid ? (
              <Check className="h-4 w-4 text-green-500" />
            ) : (
              <X className="h-4 w-4 text-red-500" />
            )}
            <span className={matchRule.valid ? "text-green-500" : "text-red-500"}>
              {matchRule.text}
            </span>
          </li>
        )}
      </ul>
    </div>
  );
}
