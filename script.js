const scene = document.querySelector(".scene");
const controls = document.querySelectorAll(".control");

function setStep(step) {
  scene.dataset.step = step;

  controls.forEach((control) => {
    const isActive = control.dataset.step === step;
    control.classList.toggle("active", isActive);
    control.setAttribute("aria-pressed", String(isActive));
  });
}

controls.forEach((control) => {
  control.addEventListener("click", () => {
    setStep(control.dataset.step);
  });
});

setStep("1");
