import {
  render,
  screen,
  within,
  waitFor,
  fireEvent,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { describe, it, expect, vi } from "vitest";
import { usePhotoSession } from "../lib/photos";
import { BeforeAfterSlider } from "../components/UI";
import App from "../App";
import QuoteConfigurator from "../components/QuoteConfigurator";
import { PhotoPicker } from "../components/PhotoPicker";
import { dictionaries } from "../i18n";
import { business } from "../config/business";
import { emptyQuote } from "../lib/quote";
import { loadDraft, saveDraft } from "../lib/draft";
function Path() {
  return <output data-testid="path">{useLocation().pathname}</output>;
}
function app(path = "/") {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        <App />
        <Path />
      </MemoryRouter>
    </HelmetProvider>,
  );
}
function form() {
  return render(
    <MemoryRouter>
      <QuoteConfigurator t={dictionaries.en} lang="en" onClose={() => {}} />
    </MemoryRouter>,
  );
}
describe("localized pages", () => {
  it("redirects root to Polish and switches all languages with persistence", async () => {
    const u = userEvent.setup();
    app();
    expect(screen.getByTestId("path")).toHaveTextContent("/pl");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Mobilny detailing",
    );
    await u.click(screen.getByRole("link", { name: "English" }));
    expect(screen.getByTestId("path")).toHaveTextContent("/en");
    expect(localStorage.getItem("prime.language")).toBe("en");
    expect(document.documentElement.lang).toBe("en");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Mobile interior",
    );
    await u.click(screen.getByRole("link", { name: "Русский" }));
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Выездной",
    );
    await u.click(screen.getByRole("link", { name: "Polski" }));
    expect(localStorage.getItem("prime.language")).toBe("pl");
  });
  it("renders packages, real links and developer signature", () => {
    app();
    for (const name of ["BASIC", "BASIC PLUS", "PREMIUM", "FAMILY & PET"])
      expect(screen.getByRole("heading", { name })).toBeInTheDocument();
    for (const price of ["249", "349", "499", "649"])
      expect(
        screen.getByText(price, { exact: false, selector: ".price strong" }),
      ).toBeInTheDocument();
    for (const link of screen.getAllByRole("link", { name: /Facebook/ }))
      expect(link).toHaveAttribute("href", business.facebook);
    expect(
      screen.getByRole("link", { name: business.signature }),
    ).toHaveAttribute("href", business.developer);
  });
  it("opens mobile menu and closes it on language selection", async () => {
    const u = userEvent.setup();
    app();
    await u.click(screen.getByRole("button", { name: "Otwórz menu" }));
    const menu = screen.getByRole("dialog");
    expect(document.body.style.overflow).toBe("hidden");
    await u.click(within(menu).getByRole("link", { name: "English" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
  });
  it("opens a package-specific quote and handles Escape cancellation", async () => {
    const u = userEvent.setup();
    app("/en");
    await u.click(
      screen.getAllByRole("button", { name: dictionaries.en.primaryCta })[0],
    );
    const dialog = screen.getByRole("dialog");
    await within(dialog).findByLabelText("Make and model");
    expect(loadDraft().package).toBe("plus");
    fireEvent(dialog, new Event("cancel", { cancelable: true }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("renders accessible FAQ and comparison controls", () => {
    app("/en");
    expect(
      screen.getByText(dictionaries.en.faq[0][0]).closest("summary"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("slider")).not.toBeInTheDocument();
    render(
      <BeforeAfterSlider
        t={dictionaries.en}
        comparison={{ before: "/before.webp", after: "/after.webp" }}
      />,
    );
    const slider = screen.getByRole("slider");
    fireEvent.change(slider, { target: { value: "70" } });
    expect(slider).toHaveValue("70");
  });
});
describe("configurator", () => {
  it("validates and selects size, help package, conditions and garage warning", async () => {
    const u = userEvent.setup();
    form();
    await u.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Please complete this field.")).toBeInTheDocument();
    await u.type(screen.getByLabelText("Make and model"), "Skoda Octavia");
    await u.click(screen.getByLabelText(dictionaries.en.calculator.sizes[2]));
    await u.click(screen.getByLabelText(/BASIC PLUS/));
    await u.click(screen.getByRole("button", { name: "Continue" }));
    await u.click(
      screen.getByLabelText(dictionaries.en.calculator.problemOptions[0]),
    );
    await u.click(screen.getByLabelText("Underground garage"));
    expect(screen.getByText(dictionaries.en.garage)).toBeInTheDocument();
    expect(loadDraft().size).toBe("suv");
    expect(loadDraft().problems).toEqual(["hair"]);
  });
  it("copies, opens verified WhatsApp and preserves entered data", async () => {
    const u = userEvent.setup();
    saveDraft({
      ...emptyQuote,
      vehicle: "Kia Ceed",
      name: "Anna",
      phone: "600123456",
      district: "Wola",
      problems: [],
      flexible: true,
    });
    form();
    for (let i = 0; i < 3; i++)
      await u.click(screen.getByRole("button", { name: "Continue" }));
    await u.click(screen.getByRole("checkbox"));
    await u.click(screen.getByRole("button", { name: "Continue" }));
    expect(screen.getByText("Kia Ceed")).toBeInTheDocument();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    await u.click(
      screen.getByRole("button", { name: dictionaries.en.form.send }),
    );
    await waitFor(() => expect(click).toHaveBeenCalled());
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining("Kia Ceed"));
    expect(loadDraft().vehicle).toBe("Kia Ceed");
    expect(
      screen.getByText(dictionaries.en.form.opening, { exact: false }),
    ).toBeInTheDocument();
    await u.click(screen.getByRole("button", { name: "Delete saved draft" }));
    expect(screen.getByLabelText("Make and model")).toHaveValue("");
  });
  it("previews and removes a local image", async () => {
    const u = userEvent.setup();
    function Picker() {
      const [photos, setPhotos] = usePhotoSession();
      return (
        <PhotoPicker
          photos={photos}
          onChange={setPhotos}
          t={dictionaries.en.form}
        />
      );
    }
    render(<Picker />);
    await u.upload(
      screen.getByLabelText(/Interior photos/),
      new File(["image"], "seat.png", { type: "image/png" }),
    );
    expect(screen.getByAltText("seat.png")).toBeInTheDocument();
    await u.click(
      screen.getByRole("button", { name: "Remove photo: seat.png" }),
    );
    expect(screen.queryByAltText("seat.png")).not.toBeInTheDocument();
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });
});
