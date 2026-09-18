import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi } from "vitest";
import Fleet from "../components/Fleet";
describe("fleet enquiry", () => {
  it("validates a separate B2B form and prepares an honest WhatsApp handoff", async () => {
    const u = userEvent.setup();
    render(
      <MemoryRouter>
        <Fleet lang="en" />
      </MemoryRouter>,
    );
    await u.click(
      screen.getByRole("button", { name: "Request a fleet quote" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Check the highlighted fields",
    );
    for (const [label, value] of [
      ["Company name", "Test company"],
      ["Contact person", "Anna"],
      ["Phone", "600123456"],
      ["Email", "anna@example.test"],
      ["Number of vehicles", "5"],
      ["Vehicle types", "Sedans"],
      ["Location", "Warsaw"],
      ["Required scope", "Regular interior cleaning"],
    ])
      await u.type(screen.getByLabelText(label, { exact: true }), value);
    await u.selectOptions(
      screen.getByLabelText("Preferred frequency"),
      "monthly",
    );
    await u.selectOptions(screen.getByLabelText("230 V access"), "no");
    await u.click(screen.getByRole("checkbox"));
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    await u.click(
      screen.getByRole("button", { name: "Request a fleet quote" }),
    );
    await waitFor(() => expect(click).toHaveBeenCalled());
    expect(screen.getByRole("status")).toHaveTextContent("Message prepared");
    expect(
      (
        screen.getByRole("textbox", {
          name: "Your enquiry",
        }) as HTMLTextAreaElement
      ).value,
    ).toContain("Monthly");
    expect(screen.getByLabelText("Company name")).toHaveValue("Test company");
  });
});
