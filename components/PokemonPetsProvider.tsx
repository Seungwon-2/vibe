"use client";

import React, { useState } from "react";
import { PokemonPet } from "./PokemonPet";
import { ChevronDown, ChevronUp, Gamepad2, Settings2 } from "lucide-react";

const POKEMON_LIST = [
  { id: 25, name: "피카츄 (Pikachu)" },
  { id: 1, name: "이상해씨 (Bulbasaur)" },
  { id: 4, name: "파이리 (Charmander)" },
  { id: 7, name: "꼬부기 (Squirtle)" },
  { id: 6, name: "리자몽 (Charizard)" },
  { id: 94, name: "팬텀 (Gengar)" },
  { id: 133, name: "이브이 (Eevee)" },
  { id: 143, name: "잠만보 (Snorlax)" },
  { id: 150, name: "뮤츠 (Mewtwo)" },
  { id: 151, name: "뮤 (Mew)" },
  { id: 172, name: "피츄 (Pichu)" },
  { id: 249, name: "루기아 (Lugia)" },
  { id: 258, name: "물짱이 (Mudkip)" },
  { id: 282, name: "가디안 (Gardevoir)" },
  { id: 384, name: "레쿠쟈 (Rayquaza)" },
  { id: 448, name: "루카리오 (Lucario)" },
];

export function PokemonPetsProvider() {
  const [isOpen, setIsOpen] = useState(false);
  const [activePets, setActivePets] = useState<number[]>([]);

  const togglePet = (id: number) => {
    setActivePets((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  return (
    <>
      {/* Pets Layer */}
      {activePets.map((id) => {
        const petInfo = POKEMON_LIST.find((p) => p.id === id);
        if (!petInfo) return null;
        return <PokemonPet key={id} id={id} name={petInfo.name} />;
      })}

      {/* Remote Control */}
      <div className="fixed top-4 left-4 z-[10000] flex flex-col items-start font-sans">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 bg-white/95 backdrop-blur-sm border border-gray-200 shadow-md rounded-full px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Gamepad2 className="w-5 h-5 text-indigo-500" />
          포켓몬 리모컨
          {isOpen ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
        </button>

        {isOpen && (
          <div className="mt-2 bg-white/95 backdrop-blur-md border border-gray-200 shadow-xl rounded-xl p-4 w-72 max-h-[70vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex-shrink-0 border-b border-gray-100 pb-3 mb-2">
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-gray-500" />
                웹 화면 포켓몬 소환
              </h3>
              <p className="text-xs text-gray-500 mt-1">체크박스를 선택하면 화면에 나타납니다.</p>
            </div>
            
            <div className="overflow-y-auto flex-1 pr-2 space-y-1 custom-scrollbar">
              {POKEMON_LIST.map((pokemon) => {
                const isActive = activePets.includes(pokemon.id);
                return (
                  <label
                    key={pokemon.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-md border border-gray-100 group-hover:bg-white transition-colors overflow-hidden">
                        <img
                          src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`}
                          alt={pokemon.name}
                          className="w-12 h-12 object-contain"
                          style={{ imageRendering: "pixelated" }}
                        />
                      </div>
                      <span className="text-sm text-gray-700 font-medium">
                        {pokemon.name}
                      </span>
                    </div>
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={() => togglePet(pokemon.id)}
                        className="w-5 h-5 text-indigo-600 rounded-md border-gray-300 focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>
                  </label>
                );
              })}
            </div>

            {activePets.length > 0 && (
              <div className="flex-shrink-0 pt-3 mt-2 border-t border-gray-100">
                <button
                  onClick={() => setActivePets([])}
                  className="w-full py-2.5 text-sm text-red-600 font-bold bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  모두 몬스터볼로 되돌리기
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.5);
          border-radius: 20px;
        }
      `}} />
    </>
  );
}
