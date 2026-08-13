import { motion } from 'framer-motion';

const SectionTitle = ({ title, subtitle }: { title: string; subtitle?: string }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="text-center flex flex-col items-center"
    >
      <h2 className="text-3xl md:text-5xl font-bold font-heading text-white mb-4">
        {title}
      </h2>
      <div className="w-24 h-1 bg-gold rounded-full mb-6"></div>
      {subtitle && (
        <p className="text-text-secondary text-lg max-w-2xl text-center">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
};

export default SectionTitle;
