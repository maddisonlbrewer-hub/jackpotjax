document.addEventListener("DOMContentLoaded", () => {
  const year = document.getElementById("year");
  if (year) {
    year.textContent = new Date().getFullYear();
  }

  const membershipCard = document.querySelector(".membership-card");
  const membershipStart = document.getElementById("membership-start");
  const signupForm = document.getElementById("signup-form");
  const emailInput = document.getElementById("membership-email");
  const checkoutButton = document.getElementById("checkout-button");
  const signupStatus = document.getElementById("signup-status");
  const checkoutShell = document.getElementById("embedded-checkout-shell");
  const changeEmailButton = document.getElementById("change-email-button");

  if (!signupForm || !emailInput || !checkoutButton || !signupStatus || !checkoutShell) {
    return;
  }

  const buttonLabel = checkoutButton.textContent.trim();
  let embeddedCheckout;

  const showSignupError = (message) => {
    signupStatus.textContent = message;
    signupStatus.classList.add("is-error");
    checkoutButton.disabled = false;
    checkoutButton.textContent = buttonLabel;
  };

  const resetCheckout = () => {
    if (embeddedCheckout) {
      embeddedCheckout.destroy();
      embeddedCheckout = undefined;
    }

    document.getElementById("embedded-checkout").replaceChildren();
    checkoutShell.hidden = true;
    membershipStart.hidden = false;
    membershipCard?.classList.remove("checkout-active");
    signupStatus.textContent = "";
    signupStatus.classList.remove("is-error");
    checkoutButton.disabled = false;
    checkoutButton.textContent = buttonLabel;
    emailInput.focus();
  };

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!signupForm.reportValidity()) {
      return;
    }

    checkoutButton.disabled = true;
    checkoutButton.textContent = "Loading secure payment…";
    signupStatus.textContent = "Preparing your secure form…";
    signupStatus.classList.remove("is-error");

    try {
      const configResponse = await fetch("/api/checkout-config", {
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      const config = await configResponse.json();

      if (!configResponse.ok || !config.publishableKey) {
        throw new Error(config.error || "Secure checkout is not available yet.");
      }

      if (typeof window.Stripe !== "function") {
        throw new Error("Secure checkout could not load. Please refresh and try again.");
      }

      const stripe = window.Stripe(config.publishableKey);
      const email = emailInput.value.trim();

      const fetchClientSecret = async () => {
        const sessionResponse = await fetch(signupForm.action, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        });
        const session = await sessionResponse.json();

        if (!sessionResponse.ok || !session.clientSecret) {
          throw new Error(session.error || "We couldn’t start secure checkout.");
        }

        return session.clientSecret;
      };

      embeddedCheckout = await stripe.initEmbeddedCheckout({
        fetchClientSecret,
        onComplete: () => {
          window.location.assign("/success.html");
        },
      });

      membershipStart.hidden = true;
      checkoutShell.hidden = false;
      membershipCard?.classList.add("checkout-active");
      embeddedCheckout.mount("#embedded-checkout");
      checkoutShell.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch (error) {
      console.error("Embedded checkout initialization failed", error);
      showSignupError(error instanceof Error ? error.message : "Please try again.");
    }
  });

  changeEmailButton?.addEventListener("click", resetCheckout);
});
