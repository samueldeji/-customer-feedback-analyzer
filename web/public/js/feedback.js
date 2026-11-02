// customer-feedback-analyzer
// web/public/js/feedback.js
// Handles feedback form interactions, rating selection, character counting, and async submission.

import { postFeedback } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('feedback-form');
  const commentInput = document.getElementById('comment');
  const charCounter = document.getElementById('char-counter');
  const errorBanner = document.getElementById('error-banner');
  const emailInput = document.getElementById('customer_email');
  const emailError = document.getElementById('email-error');
  const commentError = document.getElementById('comment-error');
  const submitBtn = document.getElementById('submit-btn');
  const formContainer = document.getElementById('feedback-form-container');
  const successContainer = document.getElementById('feedback-success-container');
  const sendAnotherBtn = document.getElementById('send-another-btn');
  const clearRatingBtn = document.getElementById('clear-rating-btn');
  const ratingRadios = document.querySelectorAll('input[name="rating"]');
  const ratingButtons = document.querySelectorAll('.rating-btn');

  // Live character counter
  commentInput.addEventListener('input', () => {
    const len = commentInput.value.length;
    charCounter.textContent = `${len} / 2000`;
    if (commentError && len > 0) {
      commentError.classList.add('hidden');
    }
  });

  // Rating visual selection
  function updateRatingVisual(val) {
    ratingRadios.forEach((radio, idx) => {
      const btn = ratingButtons[idx];
      const rVal = Number(radio.value);
      if (rVal === val) {
        btn.classList.add('border-[#C2410C]', 'text-[#C2410C]', 'bg-[#FAF7F2]', 'font-semibold');
        btn.classList.remove('border-[#E5E0D8]', 'text-[#1C1A17]', 'bg-[#FFFFFF]');
      } else {
        btn.classList.remove('border-[#C2410C]', 'text-[#C2410C]', 'bg-[#FAF7F2]', 'font-semibold');
        btn.classList.add('border-[#E5E0D8]', 'text-[#1C1A17]', 'bg-[#FFFFFF]');
      }
    });

    if (val > 0) {
      clearRatingBtn?.classList.remove('hidden');
    } else {
      clearRatingBtn?.classList.add('hidden');
    }
  }

  ratingRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      updateRatingVisual(Number(radio.value) || 0);
    });
  });

  clearRatingBtn?.addEventListener('click', () => {
    ratingRadios.forEach(r => (r.checked = false));
    updateRatingVisual(0);
  });

  function hideAllErrors() {
    errorBanner?.classList.add('hidden');
    emailError?.classList.add('hidden');
    commentError?.classList.add('hidden');
  }

  function setLoading(loading) {
    submitBtn.disabled = loading;
    submitBtn.textContent = loading ? 'Sending…' : 'Send feedback';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAllErrors();

    let hasError = false;

    const comment = commentInput.value.trim();
    if (!comment) {
      if (commentError) {
        commentError.classList.remove('hidden');
      }
      commentInput.focus();
      hasError = true;
    }

    const customer_email = emailInput.value.trim() || undefined;
    if (customer_email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customer_email)) {
        if (emailError) {
          emailError.classList.remove('hidden');
        }
        if (!hasError) emailInput.focus();
        hasError = true;
      }
    }

    if (hasError) {
      return;
    }

    const selectedRating = document.querySelector('input[name="rating"]:checked');
    const rating = selectedRating ? Number(selectedRating.value) : undefined;
    const customer_name = document.getElementById('customer_name').value.trim() || undefined;
    const website = document.getElementById('form-website').value.trim();

    const payload = {
      source: 'survey',
      comment,
      ...(customer_name && { customer_name }),
      ...(customer_email && { customer_email }),
      ...(rating && { rating }),
      ...(website && { website }) // Honeypot
    };

    setLoading(true);

    try {
      await postFeedback(payload);

      // Successfully submitted: swap to thank-you screen
      formContainer.classList.add('hidden');
      successContainer.classList.remove('hidden');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      if (errorBanner) {
        errorBanner.textContent = "Couldn't send your feedback. Check your connection and try again.";
        errorBanner.classList.remove('hidden');
      }
    } finally {
      setLoading(false);
    }
  });

  // "Send another" button handler
  sendAnotherBtn.addEventListener('click', () => {
    form.reset();
    charCounter.textContent = '0 / 2000';
    updateRatingVisual(0);
    hideAllErrors();
    successContainer.classList.add('hidden');
    formContainer.classList.remove('hidden');
  });
});
