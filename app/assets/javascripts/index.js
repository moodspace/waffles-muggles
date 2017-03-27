$(document).ready(() => {
  $('#btn-book-find').click(() => {
    window.open(
      `/maps?callno=${$('#call-number').val()}&library_id=${$('#library-id').val()}`,
    );
  });
});
