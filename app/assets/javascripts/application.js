/**
 * app/assets/javascripts/application.js
 *
 * Rails application script
 *
 * Copyright (c) 2017 Ke Qian
 */

//= require rails-ujs
//= require jquery
//= require jquery_ujs
//= require turbolinks

$(() => {
  // always pass csrf tokens on ajax calls
  // see http://guides.rubyonrails.org/security.html#csrf-countermeasures
  $.ajaxSetup({
    headers: {
      'X-CSRF-Token': $('meta[name="csrf-token"]').attr('content'),
    },
  });
});
