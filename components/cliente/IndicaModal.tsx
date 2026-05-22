"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserPlus, MessageCircle } from "lucide-react";

export function IndicaModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="w-full bg-ink text-gold hover:bg-ink-light gap-2 h-11"
      >
        <UserPlus className="w-4 h-4" />
        Quero indicar alguém
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-playfair text-ink">Indicar uma amiga</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="bg-beige rounded-xl p-4 space-y-2">
              <p className="text-sm font-medium text-ink">Como funciona:</p>
              <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
                <li>Entre em contato com Isa pelo WhatsApp</li>
                <li>Informe o nome e celular da sua amiga</li>
                <li>Ela será cadastrada como sua indicada no clube</li>
                <li>Quando ela se tornar membro ativa, você ganha <span className="font-semibold text-ink">300 pontos</span> e <span className="font-semibold text-gold">R$ 30</span> em crédito</li>
              </ul>
            </div>

            <a
              href="https://wa.me/5584999261688"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg py-3 transition-colors text-sm"
            >
              <MessageCircle className="w-4 h-4" />
              Abrir WhatsApp do Studio
            </a>

            <Button variant="outline" onClick={() => setOpen(false)} className="w-full">
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
