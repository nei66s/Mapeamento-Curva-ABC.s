"use client";

import type { AiProfile } from "@/lib/ai/ai-profiles";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ProfileSelectorProps = {
  profiles: AiProfile[];
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function ProfileSelector({ profiles, value, onChange, disabled = false }: ProfileSelectorProps) {
  const activeProfile = profiles.find((profile) => profile.profileId === value);

  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Perfil de especializacao</Label>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-64">
          <SelectValue placeholder="Selecione um perfil" />
        </SelectTrigger>
        <SelectContent>
          {profiles.map((profile) => (
            <SelectItem key={profile.profileId} value={profile.profileId}>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{profile.label}</span>
                <span className="text-xs text-muted-foreground">{profile.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {activeProfile?.description && (
        <p className="text-xs text-muted-foreground">{activeProfile.description}</p>
      )}
    </div>
  );
}
