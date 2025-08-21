fetch('/php/api/get_users.php')
  .then(res => res.json())
  .then(users => { /* render users */ });