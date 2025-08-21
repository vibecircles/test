fetch('/php/api/get_comments.php?post_id=1')
  .then(res => res.json())
  .then(comments => { /* render comments */ });