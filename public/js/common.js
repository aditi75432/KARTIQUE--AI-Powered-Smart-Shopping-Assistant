const allLikeButton = document.querySelectorAll('.like-btn');


async function likeButton(productId , btn){
    try{
        let response = await axios({
            method: 'post',
            url: `/product/${productId}/like`,
            headers: {'X-Requested-With': 'XMLHttpRequest'},
        });
        
        if(btn.children[0].classList.contains('fas')){
            btn.children[0].classList.remove('fas')
            btn.children[0].classList.add('far')
        } else{
            btn.children[0].classList.remove('far')
            btn.children[0].classList.add('fas')
        }
        // console.log(response);
    }
    catch (e) {
        // console.log(e);
        window.location.replace('/login'); //redirect
        // console.log(e.message)
    }
}


for(let btn of allLikeButton){
    btn.addEventListener('click' , ()=>{
        let productId = btn.getAttribute('product-id'); 
        likeButton(productId,btn);
    })
}

async function getRecommendations(userId) {
    try {
        const res = await fetch(`http://localhost:8000/api/recommend?user_id=${userId}`);
        const data = await res.json();
        console.log("Recommended Products:", data.recommended_products);
        // Optional: Update UI
    } catch (err) {
        console.error("Recommendation Error:", err);
    }
}


// Call this function on /home or /products route with logged-in user ID
// getRecommendations(currentUser._id);
