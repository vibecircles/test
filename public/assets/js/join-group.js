fetch('/php/api/join_group.php', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({group_id: 1, user_id: 1})
})
  .then(res => res.json())
  .then(result => { /* handle result */ });