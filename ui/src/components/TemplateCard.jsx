const TemplateCard = ({ name, layout, icon }) => {
  return (
    <div className="group relative">
      {/* Glow Effect Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent-mint/10 rounded-button-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"></div>
      
      <div className="relative bg-deep-blue border-2 border-soft-blue/50 rounded-button-lg p-8 aspect-square flex flex-col items-center justify-center hover:shadow-glow hover:border-primary transition-all duration-300 cursor-pointer overflow-hidden">
        {/* Animated Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent-mint/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Icon with Enhanced Styling */}
        <div className="relative z-10 mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="text-7xl font-bold text-primary relative z-10 group-hover:scale-110 group-hover:drop-shadow-[0_0_20px_rgba(76,111,255,0.6)] transition-all duration-300">
              {icon}
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 text-center">
          <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-primary transition-colors duration-300">
            {name}
          </h3>
        </div>
        
        {/* Bottom Accent Line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
    </div>
  )
}

export default TemplateCard
