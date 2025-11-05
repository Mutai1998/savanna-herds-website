//JavaScript for text slider 
  const slides = [
    {
      heading: "SAVANNA HERDS – From Pasture to Plate.",
      subtext: "Sustainable sourcing and export of top-grade livestock and premium chilled and frozen meats"
    },
    {
      heading: "Top-Grade Chilled Meat",
      subtext: "Delivering premium quality organic meat products to your table"
    },
    {
      heading: "Empowering Farmers, Feeding Nations",
      subtext: "Partnering with local farmers for a sustainable future"
    },
    {
      heading: "Premium Quality, Trusted Worldwide",
      subtext: "Ethically sourced and globally recognized livestock products"
    }
  ];

  let currentSlide = 0;
  const heading = document.getElementById("hero-heading");
  const subtext = document.getElementById("hero-subtext");

  // make sure subtext always stays white
  subtext.style.color = "white";

  function showSlide(index) {
    heading.classList.remove("show");
    subtext.classList.remove("show");

    setTimeout(() => {
      heading.textContent = slides[index].heading;
      subtext.textContent = slides[index].subtext;
      heading.classList.add("show");
      subtext.classList.add("show");
    }, 1000); // wait for fade-out
  }

  // Start
  showSlide(currentSlide);
  setInterval(() => {
    currentSlide = (currentSlide + 1) % slides.length;
    showSlide(currentSlide);
  }, 8000); // every 8 seconds
