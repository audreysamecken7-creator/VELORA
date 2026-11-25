window.addEventListener("load", () => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  gsap.registerPlugin(ScrollTrigger);

  if (!reduced) {
    const count = {value:0};
    gsap.to(count,{value:100,duration:1.8,ease:"power2.inOut",onUpdate(){
      $("#loader-count").textContent = String(Math.floor(count.value)).padStart(2,"0");
      gsap.set("#loader-bar",{width:count.value+"%"});
    },onComplete(){
      const tl=gsap.timeline({
        onComplete(){
          gsap.set("#loader",{display:"none"});
          document.body.classList.remove("locked");
          startPageAnimations();
        }
      });
      tl.to(".loader__mark",{opacity:1,scale:1.15,duration:.35},"0")
        .to(".loader__mark",{rotation:360,scale:.15,opacity:0,duration:.55,ease:"power3.in"})
        .to(".loader__track,.loader__count",{opacity:0,duration:.25},"-=.2")
        .to("#loader",{clipPath:"circle(0% at 50% 50%)",duration:.85,ease:"power4.inOut"});
    }});
    gsap.set(".loader__mark",{scale:.6,opacity:0});
  } else {
    gsap.set("#loader",{display:"none"});
    document.body.classList.remove("locked");
    startPageAnimations();
  }

  function startPageAnimations(){
    const tl = gsap.timeline();
    tl.from("#navbar",{y:-80,opacity:0,duration:.7,ease:"power3.out"})
      .from(".hero__copy .eyebrow,.hero-title span,.hero__lede,.hero__copy .pill-button",{y:45,opacity:0,duration:.75,stagger:.09,ease:"power3.out"},"-=.35")
      .from(".hero__arch",{clipPath:"inset(100% 0 0 0)",scale:1.12,duration:1.1,ease:"power4.out"},"-=.85")
      .from(".hero__badge,.floating-tag",{scale:0,opacity:0,rotation:45,duration:.55,stagger:.12,ease:"back.out(1.7)"},"-=.6");

    gsap.to(".hero__arch", {yPercent:-8, ease:"none", scrollTrigger:{trigger:"#home",start:"top top",end:"bottom top",scrub:1}});
    gsap.to(".floating-tag.tag-one",{y:-35,rotation:-5,scrollTrigger:{trigger:"#home",start:"top top",end:"bottom top",scrub:1}});
    gsap.to(".floating-tag.tag-two",{y:40,rotation:8,scrollTrigger:{trigger:"#home",start:"top top",end:"bottom top",scrub:1}});

    gsap.utils.toArray(".reveal").forEach(el=>{
      gsap.to(el,{opacity:1,y:0,duration:.85,ease:"power3.out",scrollTrigger:{trigger:el,start:"top 86%",once:true}});
    });
    gsap.utils.toArray(".image-reveal").forEach(el=>{
      gsap.to(el,{clipPath:"inset(0 0 0 0)",duration:1.1,ease:"power4.out",scrollTrigger:{trigger:el,start:"top 82%",once:true}});
    });
    gsap.utils.toArray(".category-card").forEach((card,i)=>{
      gsap.from(card,{y:60,opacity:0,duration:.75,delay:i*.04,ease:"power3.out",scrollTrigger:{trigger:"#categories",start:"top 70%",once:true}});
    });
    gsap.to(".manifesto__image img",{yPercent:-8,scale:1.08,ease:"none",scrollTrigger:{trigger:"#about",start:"top bottom",end:"bottom top",scrub:1}});
    gsap.to(".editorial-card--main img",{yPercent:-8,ease:"none",scrollTrigger:{trigger:"#collections",start:"top bottom",end:"bottom top",scrub:1}});
    gsap.to(".editorial-card--top img",{yPercent:-12,ease:"none",scrollTrigger:{trigger:"#collections",start:"top bottom",end:"bottom top",scrub:1}});
  }

  window.ProductAnimations = function(){
    gsap.to(".product-card",{opacity:1,y:0,duration:.55,stagger:.055,ease:"power3.out",overwrite:true});
  };
  window.ProductAnimations();

  const navbar=$("#navbar");
  window.addEventListener("scroll",()=>navbar.classList.toggle("scrolled",window.scrollY>30),{passive:true});

  if (!reduced && window.innerWidth > 720) {
    const cursor=$("#cursor"), dot=$("#cursor-dot");
    let cx=innerWidth/2, cy=innerHeight/2, dx=cx, dy=cy;
    window.addEventListener("mousemove",e=>{
      cx=e.clientX; cy=e.clientY;
      dot.style.left=cx+"px"; dot.style.top=cy+"px";
    });
    function cursorLoop(){
      dx+=(cx-dx)*.12; dy+=(cy-dy)*.12;
      cursor.style.left=dx+"px"; cursor.style.top=dy+"px";
      requestAnimationFrame(cursorLoop);
    }
    cursorLoop();
    document.querySelectorAll("button,a,[data-cursor]").forEach(el=>{
      el.addEventListener("mouseenter",()=>cursor.classList.add("active"));
      el.addEventListener("mouseleave",()=>cursor.classList.remove("active"));
    });
    document.querySelectorAll(".magnetic").forEach(el=>{
      el.addEventListener("mousemove",e=>{
        const r=el.getBoundingClientRect();
        gsap.to(el,{x:(e.clientX-r.left-r.width/2)*.12,y:(e.clientY-r.top-r.height/2)*.12,duration:.35,ease:"power3.out"});
      });
      el.addEventListener("mouseleave",()=>gsap.to(el,{x:0,y:0,duration:.5,ease:"elastic.out(1,.4)"}));
    });
  }

  document.querySelectorAll(".product-card__media").forEach(card=>{
    card.addEventListener("mousemove",e=>{
      if(reduced || innerWidth<721) return;
      const r=card.getBoundingClientRect();
      const rx=((e.clientY-r.top)/r.height-.5)*-4;
      const ry=((e.clientX-r.left)/r.width-.5)*4;
      gsap.to(card.querySelector(".main-image"),{rotationX:rx,rotationY:ry,scale:1.02,duration:.35,ease:"power2.out",transformPerspective:900});
    });
    card.addEventListener("mouseleave",()=>gsap.to(card.querySelector(".main-image"),{rotationX:0,rotationY:0,scale:1,duration:.5}));
  });

  if (window.lottie) {
    try {
      const lottieContainer = $("#lottie-cart");
      lottieContainer.textContent = "";
      window.lottie.loadAnimation({
        container: lottieContainer,
        renderer:"svg",
        loop:true,
        autoplay:true,
        path:"https://assets2.lottiefiles.com/packages/lf20_j1adxtyb.json"
      });
    } catch (_) {}
  }
});
