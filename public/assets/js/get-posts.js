fetch('/php/api/get_posts.php?user_id=1')
  .then(res => res.json())
  .then(posts => { /* render posts */ });