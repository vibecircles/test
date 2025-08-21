fetch('/php/api/add_comment.php', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({post_id: 1, user_id: 1, content: 'Nice post!'})
})
  .then(res => res.json())
  .then(result => { /* handle result */ });