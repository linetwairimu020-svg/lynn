const menuToggle = document.querySelector('.menu-toggle');
const siteNavigation = document.querySelector('#site-navigation');

menuToggle.addEventListener('click', () => {
  const isOpen = siteNavigation.classList.toggle('is-open');
  menuToggle.setAttribute('aria-expanded', String(isOpen));
  menuToggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
  document.body.classList.toggle('menu-open', isOpen);
});

document.querySelectorAll('.site-nav a').forEach((link) => {
  link.addEventListener('click', () => {
    siteNavigation.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation menu');
    document.body.classList.remove('menu-open');
  });
});

const revealItems = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

revealItems.forEach((item) => revealObserver.observe(item));

const form = document.querySelector('.contact-form');
const formStatus = document.querySelector('.form-status');

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const fields = [...form.querySelectorAll('input, textarea')];
  let isValid = true;

  fields.forEach((field) => {
    const error = field.parentElement.querySelector('.error-message');
    let message = '';
    if (!field.value.trim()) message = 'This field is required.';
    else if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) message = 'Please enter a valid email.';
    field.classList.toggle('invalid', Boolean(message));
    field.setAttribute('aria-invalid', String(Boolean(message)));
    error.textContent = message;
    if (message) isValid = false;
  });

  if (isValid) {
    formStatus.textContent = 'Thanks for reaching out. This form is ready to connect to your email service.';
    form.reset();
    fields.forEach((field) => field.removeAttribute('aria-invalid'));
  } else {
    formStatus.textContent = 'Please check the highlighted fields.';
  }
});
