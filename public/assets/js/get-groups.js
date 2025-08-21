fetch('/php/api/get_groups.php')
  .then(res => res.json())
  .then(groups => { /* render groups */ });