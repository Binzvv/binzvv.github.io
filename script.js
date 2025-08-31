document.addEventListener('DOMContentLoaded',()=>{
  if(window.gsap){
    gsap.registerPlugin(ScrollTrigger);
    gsap.from('h2',{y:50,opacity:0,duration:1,stagger:0.3,scrollTrigger:{trigger:'h2',start:'top 90%'}});
  }
});