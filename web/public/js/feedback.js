// customer-feedback-analyzer
// web/public/js/feedback.js
// Handles feedback form interactions, star ratings, character counting, and async submission.

import { postFeedback } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('feedback-form');
  const commentInput = document.getElementById('comment');
  const charCounter = document.getElementById('char-counter');
  const errorBanner = document.getElementById('error-banner');
  const errorMessage = document.getElementById('error-message');
  const submitBtn = document.getElementById('submit-btn');
  const submitBtnText = document.getElementById('submit-btn-text');
  const submitBtnSpinner = document.getElementById('submit-btn-spinner');
  const formContainer = document.getElementById('feedback-form-container');
  const successContainer = document.getElementById('feedback-success-container');
  const sendAnotherBtn = document.getElementById('send-another-btn');
  const clearRatingBtn = document.getElementById('clear-rating-btn');
  const ratingRadios = document.querySelectorAll('input[name="rating"]');
  const starIcons = document.querySelectorAll('.star-icon');

  // Live character counter
  commentInput.addEventListener('input', () => {
    const len = commentInput.value.length;
    charCounter.textContent = `${len} / 2000`;
    if (len >= 1950) {
      charCounter.classList.add('text-red-500');
    } else {
      charCounter.classList.remove('text-red-500');
    }
  });

  // Star rating visual highlight
  function updateStars(selectedValue) {
    const val = Number(selectedValue) || 0;
    ratingRadios.forEach((radio, idx) => {
      const star = starIcons[idx];
      const starVal = idx + 1;
      if (starVal <= val) {
        star.classList.remove('text-slate-300');
        star.classList.add('text-amber-400');
      } else {
        star.classList.remove('text-amber-400');
        star.classList.add('text-slate-300');
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
      updateStars(radio.value);
    });
  });

  clearRatingBtn?.addEventListener('click', () => {
    ratingRadios.forEach(r => (r.checked = false));
    updateStars(0);
  });

  function showError(msg) {
    errorMessage.textContent = msg;
    errorBanner.classList.remove('hidden');
    errorBanner.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function hideError() {
    errorBanner.classList.add('hidden');
  }

  function setLoading(loading) {
    submitBtn.disabled = loading;
    if (loading) {
      submitBtnSpinner.classList.remove('hidden');
      submitBtnText.textContent = 'Submitting...';
    } else {
      submitBtnSpinner.classList.add('hidden');
      submitBtnText.textContent = 'Send Feedback';
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const comment = commentInput.value.trim();
    if (!comment) {
      showError('Please write your comments before submitting.');
      commentInput.focus();
      return;
    }

    if (comment.length > 2000) {
      showError('Comments cannot exceed 2000 characters.');
      commentInput.focus();
      return;
    }

    const selectedRating = document.querySelector('input[name="rating"]:checked');
    const rating = selectedRating ? Number(selectedRating.value) : undefined;
    const customer_name = document.getElementById('customer_name').value.trim() || undefined;
    const customer_email = document.getElementById('customer_email').value.trim() || undefined;
    const website = document.getElementById('form-website').value.trim();

    if (customer_email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customer_email)) {
        showError('Please enter a valid email address, or leave it blank.');
        document.getElementById('customer_email').focus();
        return;
      }
    }

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
      showError(err.message || 'Unable to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  });

  // "Send Another" button handler
  sendAnotherBtn.addEventListener('click', () => {
    form.reset();
    charCounter.textContent = '0 / 2000';
    updateStars(0);
    hideError();
    successContainer.classList.add('hidden');
    formContainer.classList.remove('hidden');
  });
});
