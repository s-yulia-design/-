(function () {
  "use strict";

  function showMessage(form, type, text) {
    var box = form.querySelector("[data-form-message]");
    if (!box) return;
    box.hidden = false;
    box.className = "form-message form-message--" + type;
    box.textContent = text;
  }

  function hideMessage(form) {
    var box = form.querySelector("[data-form-message]");
    if (box) {
      box.hidden = true;
      box.textContent = "";
    }
  }

  function validateForm(form) {
    var name = form.querySelector('[name="name"]');
    var phone = form.querySelector('[name="phone"]');
    var email = form.querySelector('[name="email"]');
    var consent = form.querySelector('[name="consent"]');

    if (!name || !name.value.trim()) {
      return "Укажите, пожалуйста, имя.";
    }

    var phoneVal = phone && phone.value.trim();
    var emailVal = email && email.value.trim();
    if (!phoneVal && !emailVal) {
      return "Укажите телефон или email — хотя бы один способ связи.";
    }

    if (emailVal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      return "Проверьте формат email.";
    }

    if (!consent || !consent.checked) {
      return "Нужно согласие на обработку персональных данных.";
    }

    return null;
  }

  function setSubmitting(form, submitting) {
    var btn = form.querySelector('[type="submit"]');
    if (btn) {
      btn.disabled = submitting;
      btn.textContent = submitting ? "Отправляется…" : btn.getAttribute("data-label-default") || "Отправить заявку";
    }
  }

  function hasPublicContacts(cfg) {
    return !!(cfg.email || cfg.phone || cfg.telegram || cfg.whatsapp || cfg.vk || cfg.max);
  }

  function initForm() {
    var form = document.querySelector("[data-booking-form]");
    var bookingSection = document.querySelector("#booking");
    if (!form || typeof SITE_CONFIG === "undefined") return;

    var submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) {
      submitBtn.setAttribute("data-label-default", submitBtn.textContent);
    }

    var endpoint = SITE_CONFIG.formEndpoint;
    var notice = form.querySelector("[data-form-setup-notice]");
    var hasContacts = hasPublicContacts(SITE_CONFIG);

    if (!endpoint && !hasContacts) {
      if (bookingSection) bookingSection.hidden = true;
      return;
    }

    form.removeAttribute("action");

    if (!endpoint) {
      if (submitBtn) submitBtn.disabled = true;
      if (notice) notice.hidden = false;
      return;
    }

    if (notice) notice.hidden = true;

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      hideMessage(form);

      var hp = form.querySelector('[name="website"]');
      if (hp && hp.value) return;

      var err = validateForm(form);
      if (err) {
        showMessage(form, "error", err);
        if (window.siteAnalytics) window.siteAnalytics.track("form_submit_error");
        return;
      }

      setSubmitting(form, true);

      var data = new FormData(form);

      fetch(endpoint, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      })
        .then(function (res) {
          if (!res.ok) throw new Error("bad response");
          return res.json().catch(function () {
            return {};
          });
        })
        .then(function () {
          showMessage(form, "success", "Заявка отправлена. Я свяжусь с вами удобным способом.");
          form.reset();
          if (window.siteAnalytics) window.siteAnalytics.track("form_submit_success");
        })
        .catch(function () {
          showMessage(form, "error", "Не удалось отправить заявку. Попробуйте позже или напишите напрямую.");
          if (window.siteAnalytics) window.siteAnalytics.track("form_submit_error");
        })
        .finally(function () {
          setSubmitting(form, false);
        });
    });

    form.addEventListener("focusin", function () {
      if (window.siteAnalytics) window.siteAnalytics.track("form_open");
    }, { once: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initForm);
  } else {
    initForm();
  }
})();
