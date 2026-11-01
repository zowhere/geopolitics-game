import { useEffect, useState } from "react";
import {
  Combobox,
  ComboboxButton,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import Helmet from "../components/Helmet";
import Island from "../components/Island";
import SoldierCount from "../components/SoldierCount";
import { countries } from "../game/countries";
import { countryShape } from "../map/countryShape";
import "./ChooseCountryScreen.css";

type ChooseCountryScreenProps = {
  onBack: () => void;
  onPlay: (country: string) => void;
};

const choices = [...countries].sort((a, b) => a.name.localeCompare(b.name));

const byPopulation = [...countries].sort((a, b) => b.population - a.population);
const middle = Math.floor(byPopulation.length / 2);
const featured = [
  ...byPopulation.slice(0, 6),
  ...byPopulation.slice(middle - 1, middle + 2),
  ...byPopulation.slice(-4),
];

const soldierRanges = [
  { label: "All", min: 1, max: 9 },
  { label: "1–3", min: 1, max: 3 },
  { label: "4–6", min: 4, max: 6 },
  { label: "7–9", min: 7, max: 9 },
];

function formatPopulation(population: number) {
  const millions = population / 1_000_000;
  if (millions >= 1000) return `${(millions / 1000).toFixed(2)} billion people`;
  if (millions >= 1) return `${millions.toFixed(1)} million people`;
  return `${population.toLocaleString()} people`;
}

function ChooseCountryScreen({ onBack, onPlay }: ChooseCountryScreenProps) {
  const [selected, setSelected] = useState("South Africa");
  const [query, setQuery] = useState("");
  const [range, setRange] = useState(soldierRanges[0]);

  const matches = choices.filter((country) =>
    country.name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const chosen = choices.find((country) => country.name === selected)!;
  const showingAll = range === soldierRanges[0];
  const visible = showingAll
    ? featured.includes(chosen)
      ? featured
      : [...featured, chosen]
    : choices.filter(
        (country) =>
          country.soldiers >= range.min && country.soldiers <= range.max,
      );

  useEffect(() => {
    document
      .querySelector(`[data-country="${selected}"]`)
      ?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selected]);

  function pickFromList(name: string | null) {
    if (!name) return;
    setRange(soldierRanges[0]);
    setSelected(name);
  }

  return (
    <main className="choose-screen">
      <header className="choose-header">
        <h1 className="choose-title">Choose your country</h1>
        <button className="btn btn-outline" type="button" onClick={onBack}>
          Back
        </button>
      </header>

      <div className="choose-tools">
        <Combobox
          value={selected}
          onChange={pickFromList}
          onClose={() => setQuery("")}
          immediate
        >
          <div className="country-picker">
            <ComboboxInput
              className="country-picker-input"
              aria-label="Choose your country"
              placeholder="Search countries"
              displayValue={(name: string) => name}
              onChange={(event) => setQuery(event.target.value)}
            />
            <ComboboxButton className="country-picker-toggle">
              <svg viewBox="0 0 14 9" aria-hidden="true">
                <path d="M1 1l6 6 6-6" />
              </svg>
            </ComboboxButton>
          </div>
          <ComboboxOptions anchor="bottom start" className="country-options">
            {matches.map((country) => (
              <ComboboxOption
                key={country.name}
                value={country.name}
                className="country-option"
              >
                {country.name}
              </ComboboxOption>
            ))}
            {matches.length === 0 && (
              <p className="country-options-empty">No countries match</p>
            )}
          </ComboboxOptions>
        </Combobox>
        <div className="choose-ranges" aria-label="Filter by soldiers">
          {soldierRanges.map((option) => (
            <button
              key={option.label}
              type="button"
              aria-pressed={option === range}
              onClick={() => setRange(option)}
            >
              {option !== soldierRanges[0] && (
                <Helmet className="choose-range-helmet" />
              )}
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="choose-grid">
        {visible.map((country) => (
          <button
            key={country.name}
            type="button"
            data-country={country.name}
            className={
              country.name === selected
                ? "choose-country selected"
                : "choose-country"
            }
            onClick={() => setSelected(country.name)}
          >
            <span className="choose-population">
              {formatPopulation(country.population)}
            </span>
            <Island shape={countryShape(country.mapName)} color={country.color} />
            <span className="choose-label">
              {country.name}
              <SoldierCount count={country.soldiers} />
            </span>
          </button>
        ))}
        {showingAll && (
          <span className="choose-more" title="More countries in the list">
            …
          </span>
        )}
      </div>

      <footer className="choose-bar">
        <span className="choose-bar-name">{chosen.name}</span>
        <button
          className="btn btn-gold"
          type="button"
          onClick={() => onPlay(selected)}
        >
          Play
        </button>
      </footer>
    </main>
  );
}

export default ChooseCountryScreen;
