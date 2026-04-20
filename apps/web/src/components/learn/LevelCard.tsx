'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Level } from '@/types/learning'
import { Play } from 'lucide-react'

interface LevelCardProps {
  level: Level;
  onClick?: (levelId: string) => void;
}

export default function LevelCard({ level, onClick }: LevelCardProps) {
  // Determine signal bars based on level depth
  const getSignalBars = (code: string) => {
    let activeBars = 1;
    if (code.includes('A2')) activeBars = 2;
    if (code.includes('B1')) activeBars = 3;
    if (code.includes('B2')) activeBars = 4;
    if (code.includes('C1')) activeBars = 5;

    return (
      <div className="flex items-end gap-[2px] h-4">
        {[1, 2, 3, 4, 5].map((bar) => (
          <div
            key={bar}
            className={`w-1 rounded-sm ${
              bar <= activeBars ? 'bg-primary' : 'bg-border'
            }`}
            style={{ height: `${20 + bar * 20}%` }}
          />
        ))}
      </div>
    )
  }

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-lg hover:shadow-primary/10 hover:border-primary/30 transition-all flex flex-col group cursor-pointer relative"
      onClick={() => onClick && onClick(level.code)}
    >
      <div className="p-6 flex-1 flex flex-col pt-8">
        <span className="text-[10px] font-bold tracking-widest text-foreground/40 uppercase mb-3">
          NIVEL
        </span>
        
        <h3 className="text-xl font-bold text-foreground mb-3 leading-tight group-hover:text-primary transition-colors">
          {level.title}
        </h3>
        
        <div className="flex items-center gap-2 mb-4">
          {getSignalBars(level.code)}
          <span className="text-sm font-medium text-foreground/80">
            {level.code} - Básico
          </span>
        </div>
        
        <p className="text-sm text-foreground/60 mb-6 flex-1 line-clamp-3">
          {level.description}
        </p>

        {/* Creator Info */}
        <div className="flex items-center gap-3 mt-auto">
          <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 overflow-hidden">
            {level.creatorAvatar ? (
              <img src={level.creatorAvatar} alt={level.creatorName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-primary font-bold text-sm">
                {level.creatorName.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground/90">{level.creatorName}</p>
            <p className="text-xs text-foreground/50">{level.creatorRole}</p>
          </div>
        </div>
      </div>

      <div className="bg-background/50 border-t border-border/50 p-4 shrink-0">
        <div className="flex items-center gap-4">
          {/* Progress Bar Container */}
          <div className="flex-1 flex items-center gap-3">
            <div className="flex-1 h-2 bg-border relative rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${level.progressPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="absolute top-0 left-0 h-full bg-primary rounded-full relative"
              >
                {/* Shine effect */}
                <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/20" />
              </motion.div>
            </div>
            <span className="text-xs font-bold text-foreground/60 w-8">
              {level.progressPercentage}%
            </span>
          </div>

          <button className="bg-primary hover:bg-accent text-black font-bold py-2 px-6 rounded-lg transition-all flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95 shrink-0">
            <span>Continuar</span>
            <Play size={14} className="fill-black" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
