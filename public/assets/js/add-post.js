fetch('/php/api/add_post.php', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({user_id: 1, content: 'Hello world!'})
})
  .then(res => res.json())
  .then(result => { /* handle result */ });