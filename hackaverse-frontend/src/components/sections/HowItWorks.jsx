import { useEffect, useRef, useState } from 'react';

const HowItWorks = () => {
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const steps = [
    {
      number: 1,
      icon: 'uil-users-alt',
      title: 'Register & Team Up',
      description: 'Join solo or match with teammates via smart pairing.'
    },
    {
      number: 2,
      icon: 'uil-robot',
      title: 'Build with AI Guidance',
      description: '24/7 mentorship from experts and AI assistants.'
    },
    {
      number: 3,
      icon: 'uil-trophy',
      title: 'Submit & Win',
      description: 'Fair automated scoring and real prizes.'
    }
  ];

  return (
    <section ref={sectionRef} className="how-it-works">
      <h2 className="how-it-works-title">How It Works</h2>
      
      <ol className="how-it-works-steps">
        <div className="how-it-works-progress" aria-hidden="true"></div>
        
        {steps.map((step, index) => (
          <li 
            key={step.number}
            className={`how-it-works-step ${isVisible ? 'reveal' : ''}`}
            style={{ animationDelay: `${0.1 + index * 0.1}s` }}
          >
            <div className="how-it-works-badge" aria-label={`Step ${step.number}`}>
              {step.number}
            </div>
            
            <i className={`uil ${step.icon} how-it-works-icon`} aria-hidden="true"></i>
            
            <h3 className="how-it-works-step-title">
              {step.title}
            </h3>
            
            <p className="how-it-works-step-description">
              {step.description}
            </p>
          </li>
        ))}
      </ol>

      <div className="how-it-works-cta">
        <a 
          href="/guide" 
          className="how-it-works-cta-primary"
          aria-label="Read the complete guide"
        >
          <i className="uil uil-book-open" aria-hidden="true"></i>
          Read the Complete Guide
        </a>
        
        <a 
          href="/rules" 
          className="how-it-works-cta-secondary"
        >
          View Rulebook
        </a>
      </div>
    </section>
  );
};

export default HowItWorks;