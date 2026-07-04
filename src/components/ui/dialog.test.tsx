import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Dialog, DialogContent, DialogTitle } from "./dialog";

describe("DialogContent (mobile safety)", () => {
  it("tem largura com margem lateral e altura/rolagem limitadas para caber em telas pequenas", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Título</DialogTitle>
          conteúdo
        </DialogContent>
      </Dialog>,
    );

    const content = screen.getByText("conteúdo").closest('[role="dialog"]');
    expect(content).not.toBeNull();
    expect(content?.className).toMatch(/max-h-\[90vh\]/);
    expect(content?.className).toMatch(/overflow-y-auto/);
    expect(content?.className).toMatch(/w-\[calc\(100%-2rem\)\]/);
  });
});
