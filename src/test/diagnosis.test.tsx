import { QueryClient } from "@tanstack/react-query";
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

function renderAt(path: string) {
  const queryClient = new QueryClient();
  const router = createRouter({
    routeTree,
    context: { queryClient },
    history: createMemoryHistory({ initialEntries: [path] }),
  });
  return render(<RouterProvider router={router} />);
}

afterEach(() => {
  cleanup();
});

describe("Visit diagnosis", () => {
  it("offers Provisional and Final, with Provisional selected by default", async () => {
    renderAt("/");
    fireEvent.click(await screen.findByRole("tab", { name: /Visit/ }));

    const provisional = await screen.findByRole("radio", { name: "Provisional" });
    const final = screen.getByRole("radio", { name: "Final" });

    expect(provisional).toBeChecked();
    expect(final).not.toBeChecked();
  });

  it("lets the doctor switch the diagnosis type to Final", async () => {
    renderAt("/");
    fireEvent.click(await screen.findByRole("tab", { name: /Visit/ }));

    const provisional = await screen.findByRole("radio", { name: "Provisional" });
    const final = screen.getByRole("radio", { name: "Final" });
    fireEvent.click(final);

    await waitFor(() => expect(final).toBeChecked());
    expect(provisional).not.toBeChecked();
  });

  it("keeps diagnosis free text optional and separate from its type", async () => {
    renderAt("/");
    fireEvent.click(await screen.findByRole("tab", { name: /Visit/ }));

    const field = await screen.findByLabelText("Diagnosis");
    expect(field).toHaveValue("");

    fireEvent.change(field, { target: { value: "Acute pharyngitis" } });
    await waitFor(() => expect(field).toHaveValue("Acute pharyngitis"));
    expect(screen.getByRole("radio", { name: "Provisional" })).toBeChecked();
  });
});
