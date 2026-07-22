import { Check, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useI18n } from "../lib/i18n";
import type { DateFormat, LinkDisplayMode, ThemeMode, UiDensity, UserSettings } from "../lib/types";

interface SettingsPopoverProps {
  settings: UserSettings;
  onChange(settings: UserSettings): void;
  onClose(): void;
}

interface Option<T extends string> {
  value: T;
  label: string;
  detail: string;
}

function OptionList<T extends string>({
  title,
  value,
  options,
  onSelect,
}: {
  title: string;
  value: T;
  options: Option<T>[];
  onSelect(value: T): void;
}) {
  return (
    <section className="settings-section">
      <p className="settings-section-title">{title}</p>
      <div className="settings-options" role="radiogroup" aria-label={title}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            onClick={() => onSelect(option.value)}
          >
            <span>
              <strong>{option.label}</strong>
              <small>{option.detail}</small>
            </span>
            {value === option.value ? <Check aria-hidden="true" /> : null}
          </button>
        ))}
      </div>
    </section>
  );
}

export function SettingsPopover({ settings, onChange, onClose }: SettingsPopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { t } = useI18n();
  const themeOptions: Option<ThemeMode>[] = [
    { value: "system", ...t.themeOptions.system },
    { value: "light", ...t.themeOptions.light },
    { value: "dark", ...t.themeOptions.dark },
  ];
  const densityOptions: Option<UiDensity>[] = [
    { value: "compact", ...t.densityOptions.compact },
    { value: "comfortable", ...t.densityOptions.comfortable },
  ];
  const dateOptions: Option<DateFormat>[] = [
    { value: "localized", ...t.dateOptions.localized },
    { value: "iso", ...t.dateOptions.iso },
  ];
  const linkDisplayOptions: Option<LinkDisplayMode>[] = [
    { value: "merged", ...t.linkDisplayOptions.merged },
    { value: "independent", ...t.linkDisplayOptions.independent },
  ];

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (event.target instanceof Element && event.target.closest(".settings-anchor")) return;
      if (!panelRef.current?.contains(event.target as Node)) onClose();
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <div ref={panelRef} className="settings-panel" role="dialog" aria-label={t.settingsTitle}>
      <header className="settings-header">
        <div>
          <span>{t.settingsEyebrow}</span>
          <strong>{t.settingsTitle}</strong>
        </div>
        <button type="button" aria-label={t.closeSettings} onClick={onClose}><X /></button>
      </header>

      <OptionList
        title={t.themeSection}
        value={settings.theme}
        options={themeOptions}
        onSelect={(theme) => onChange({ ...settings, theme })}
      />
      <OptionList
        title={t.densitySection}
        value={settings.density}
        options={densityOptions}
        onSelect={(density) => onChange({ ...settings, density })}
      />
      <OptionList
        title={t.dateFormatSection}
        value={settings.dateFormat}
        options={dateOptions}
        onSelect={(dateFormat) => onChange({ ...settings, dateFormat })}
      />
      <OptionList
        title={t.linkDisplaySection}
        value={settings.linkDisplay}
        options={linkDisplayOptions}
        onSelect={(linkDisplay) => onChange({ ...settings, linkDisplay })}
      />

      <footer className="settings-footer">
        {t.settingsFooter}
      </footer>
    </div>
  );
}
