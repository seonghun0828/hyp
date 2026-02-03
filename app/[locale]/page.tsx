'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import { motion, useInView } from 'framer-motion';
import { useFunnelStore, ProductSummary } from '@/lib/store';
import { isValidUrl } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';
import Button from '@/components/Button';
import LoginModal from '@/components/auth/LoginModal';
import PaymentModal from '@/components/PaymentModal';
import Footer from '@/components/Footer';
import { useCreditStore } from '@/lib/store';
import { useAuthStore } from '@/lib/auth-store';

export default function HomePage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const tHome = useTranslations('home');
  const tCommon = useTranslations('common');
  const tPayment = useTranslations('payment');

  const { url, setUrl, setSummary } = useFunnelStore();
  const [inputUrl, setInputUrl] = useState(url);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState('');
  const [error, setError] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showStickyButton, setShowStickyButton] = useState(false);
  const { user } = useAuthStore();

  const { credits, fetchCredits } = useCreditStore();
  const formRef = useRef<HTMLFormElement>(null);
  const scrollToTopButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  // Track form visibility for sticky button
  useEffect(() => {
    const handleScroll = () => {
      if (formRef.current && scrollToTopButtonRef.current) {
        const formRect = formRef.current.getBoundingClientRect();
        const scrollButtonRect =
          scrollToTopButtonRef.current.getBoundingClientRect();

        // Show sticky button when form is scrolled past (not visible in viewport)
        const isFormVisible =
          formRect.bottom > 0 && formRect.top < window.innerHeight;

        // Hide sticky button when ScrollToTopButton is visible
        const isScrollButtonVisible =
          scrollButtonRect.top < window.innerHeight &&
          scrollButtonRect.bottom > 0;

        // Show sticky button only when form is not visible AND scroll button is not visible
        setShowStickyButton(!isFormVisible && !isScrollButtonVisible);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cycle through loading stages to show progress
  useEffect(() => {
    if (!loading) {
      setLoadingStage('');
      return;
    }

    const stages = [
      { text: tHome('loadingFetchingPage'), duration: 2000 },
      { text: tHome('loadingAnalyzingContent'), duration: 3000 },
      { text: tHome('loadingExtractingFeatures'), duration: 2000 },
      { text: tHome('loadingAlmostDone'), duration: 1000 },
    ];

    let stageIndex = 0;
    let timeoutId: NodeJS.Timeout;

    const cycleStage = () => {
      if (stageIndex < stages.length) {
        setLoadingStage(stages[stageIndex].text);
        timeoutId = setTimeout(() => {
          stageIndex++;
          cycleStage();
        }, stages[stageIndex].duration);
      }
    };

    cycleStage();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loading, tHome]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!inputUrl.trim()) {
      setError(tHome('errorEmptyUrl'));
      return;
    }

    if (!isValidUrl(inputUrl)) {
      setError(tHome('errorInvalidUrl'));
      return;
    }

    // 크레딧 확인 (0이면 모달 표시)
    if (credits !== null && credits <= 0) {
      setShowPaymentModal(true);
      return;
    }

    await executeSubmit(inputUrl);
  };

  const executeSubmit = async (targetUrl: string) => {
    setLoading(true);
    setUrl(targetUrl);

    try {
      const response = await fetch('/api/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: inputUrl, locale }),
      });

      if (!response.ok) {
        const errorData = await response.json();

        // 402 Payment Required: 크레딧 부족
        if (response.status === 402) {
          setShowLoginModal(true);
          setLoading(false);
          return;
        }

        if (response.status === 403 && errorData.error === 'BOT_BLOCKED') {
          alert(tHome('errorBotBlocked'));
          router.push(`/${locale}/summary?manual=true`);
          return;
        }

        if (response.status === 500 && errorData.error === 'SERVER_ERROR') {
          if (confirm(tHome('errorServerRetry'))) {
            // 재시도 로직
            executeSubmit(targetUrl);
            return;
          }
          setError(errorData.message || tHome('errorServer'));
          return;
        }

        throw new Error(errorData.message || tHome('errorAnalysisFailed'));
      }

      const data = await response.json();

      // Zustand 스토어에 제품 요약 데이터 저장
      const summaryData: ProductSummary = {
        id: data.id,
        url: inputUrl,
        title: data.title,
        core_value: data.core_value,
        target_customer: data.target_customer,
        competitive_edge: data.competitive_edge,
        customer_benefit: data.customer_benefit,
        emotional_keyword: data.emotional_keyword,
        feature_summary: data.feature_summary,
        usage_scenario: data.usage_scenario,
        category: data.category,
      };
      setSummary(summaryData);

      trackEvent('link_submit', {
        step: 1,
        page: 'home',
        locale,
      });

      router.push(`/${locale}/summary`);
    } catch (err) {
      setError(err instanceof Error ? err.message : tHome('errorGeneric'));
    } finally {
      setLoading(false);
    }
  };

  const handleStickyButtonClick = () => {
    // If URL is empty or invalid, scroll to form and focus input
    if (!inputUrl.trim() || !isValidUrl(inputUrl)) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        document.getElementById('url')?.focus();
      }, 500);
      return;
    }

    handleSubmit({ preventDefault: () => {} } as React.FormEvent);
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      <main className="w-full pb-12 md:py-8">
        {/* Hero Section - Expanded width like process section */}
        <div className="w-full px-4 md:px-8 lg:px-12 xl:px-16">
          <div className="max-w-6xl mx-auto">
            <HeroSection />
          </div>
        </div>

        {/* Primary Action Card - Focused, constrained */}
        <div className="w-full px-4 md:px-8 lg:px-12 xl:px-16">
          <div className="max-w-xl mx-auto">
            <section className="pb-8 md:pb-12">
              <div className="bg-white rounded-lg border border-neutral-300 shadow-sm">
                {/* Card Header */}
                <div className="px-6 pt-6 pb-4 md:px-8 md:pt-8 md:pb-5 border-b border-neutral-200">
                  <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-line text-center">
                    {tHome('inputLabel')}
                  </p>
                </div>

                {/* Card Body */}
                <div className="px-6 py-6 md:px-8 md:py-8">
                  <form
                    ref={formRef}
                    onSubmit={handleSubmit}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <input
                        type="url"
                        id="url"
                        value={inputUrl}
                        onChange={(e) => setInputUrl(e.target.value)}
                        placeholder={tHome('inputPlaceholder')}
                        className="w-full px-4 py-3 text-md bg-neutral-100 border border-neutral-300 rounded-sm
                               placeholder:text-neutral-500
                               focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent
                               transition-all duration-fast"
                        disabled={loading}
                        autoComplete="url"
                      />
                      {error && (
                        <p className="text-sm text-danger-600">{error}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      loading={loading}
                      disabled={!inputUrl.trim()}
                      className="w-full"
                    >
                      {loading ? loadingStage : tHome('submitButton')}
                    </Button>
                  </form>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Trust Signals - Full width with responsive padding */}
        <div className="w-full px-4 md:px-8 lg:px-12 xl:px-16">
          <div className="max-w-xl mx-auto">
            <TrustSignals />
          </div>
        </div>

        {/* Process Section - Expanded for 3-column layout */}
        <div className="w-full px-4 md:px-8 lg:px-12 xl:px-16">
          <div className="max-w-6xl mx-auto">
            <ProcessSection />
          </div>
        </div>

        {/* Example Section - Expanded for better images */}
        <div className="w-full px-4 md:px-8 lg:px-12 xl:px-16">
          <div className="max-w-6xl mx-auto">
            <ExampleSection />
          </div>
        </div>

        {/* Bottom CTA - Centered like form */}
        <div className="w-full px-4 md:px-8 lg:px-12 xl:px-16">
          <div className="max-w-xl mx-auto">
            <ScrollToTopButton ref={scrollToTopButtonRef} />
          </div>
        </div>
      </main>

      <Footer />

      {/* Sticky CTA - no gradient, clean background */}
      {showStickyButton && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-neutral-100 border-t border-neutral-200">
          <div className="w-full px-4 md:px-8 lg:px-12 xl:px-16 py-4">
            <div className="max-w-xl mx-auto">
              <Button
                onClick={handleStickyButtonClick}
                disabled={loading}
                loading={loading}
                size="lg"
                className="w-full"
              >
                {loading
                  ? loadingStage
                  : inputUrl.trim() && isValidUrl(inputUrl)
                  ? tHome('submitButton')
                  : tHome('ctaButton')}
              </Button>
            </div>
          </div>
        </div>
      )}

      <LoginModal open={showLoginModal} onOpenChange={setShowLoginModal} />
      <PaymentModal
        open={showPaymentModal}
        onOpenChange={setShowPaymentModal}
        isLoggedIn={!!user}
        description={
          <div className="text-center">
            {tPayment('homeDescription')
              .split('\n')
              .map((line, i, arr) => (
                <span key={i}>
                  {line}
                  {i < arr.length - 1 && <br />}
                </span>
              ))}
          </div>
        }
        onSuccess={async () => {
          await fetchCredits();
          executeSubmit(inputUrl);
        }}
      />
    </div>
  );
}

/* ----- Hero Section ----- */
function HeroSection() {
  const tCommon = useTranslations('common');
  const tHome = useTranslations('home');

  return (
    <section className="pt-8 pb-8 md:pt-12 md:pb-10">
      <div className="text-center space-y-4">
        {/* Tagline - subtle, uppercase, functional */}
        <p className="text-xs font-medium text-neutral-500 tracking-widest uppercase">
          {tCommon('appTagline')}
        </p>

        {/* Main Headline - clear, direct, reassuring */}
        <h1 className="text-lg md:text-xl font-semibold text-neutral-900 leading-snug whitespace-pre-line">
          {tHome('mainHeadline')}
        </h1>

        {/* Subheadline - supportive, not hype */}
        <p className="text-md text-neutral-700 leading-relaxed whitespace-pre-line max-w-3xl mx-auto">
          {tHome('subHeadline')}
        </p>
      </div>
    </section>
  );
}

/* ----- Scroll to Top Button ----- */
const ScrollToTopButton = React.forwardRef<HTMLDivElement>((props, ref) => {
  const tHome = useTranslations('home');

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <div ref={ref} className="pt-8 pb-8">
      <Button onClick={scrollToTop} size="lg" className="w-full">
        {tHome('ctaButton')}
      </Button>
    </div>
  );
});

ScrollToTopButton.displayName = 'ScrollToTopButton';

/* ----- Trust Signals ----- */
function TrustSignals() {
  const tHome = useTranslations('home');

  const signals = [
    { value: '2,000+', label: tHome('contentCreated') },
    { value: '800+', label: tHome('happyMakers') },
    { value: '< 3 min', label: tHome('avgCreationTime') },
  ];

  return (
    <section className="py-6 mb-4 border-y border-neutral-200">
      <div className="flex flex-wrap justify-center items-start gap-8 md:gap-16">
        {signals.map((signal, index) => (
          <div key={index} className="text-center min-w-[80px]">
            <p className="text-lg font-semibold text-neutral-900">
              {signal.value}
            </p>
            <p className="text-xs text-neutral-500 mt-1">{signal.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ----- Process Section ----- */
function ProcessSection() {
  const tHome = useTranslations('home');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // 데스크톱 애니메이션: 순서대로 강조 (반복)
  useEffect(() => {
    const interval = setInterval(() => {
      setHighlightedIndex((prev) => {
        return (prev + 1) % 3;
      });
    }, 1600);

    return () => clearInterval(interval);
  }, []);

  const processImages = [
    '/images/process-examples/process-1.png',
    '/images/process-examples/process-2.png',
    '/images/process-examples/process-3.png',
  ];

  const processSteps = [
    tHome('processStep1'),
    tHome('processStep2'),
    tHome('processStep3'),
  ];

  return (
    <div className="pt-12 pb-6">
      <h3 className="text-lg font-semibold text-gray-900 pb-4 text-center">
        {tHome('processTitle')}
      </h3>
      {/* 데스크톱: 가로 1열 */}
      <div className="hidden md:flex justify-center items-center gap-6">
        {processImages.map((src, index) => {
          const isHighlighted = highlightedIndex === index;
          const isDimmed = !isHighlighted;
          const isLowBrightness = highlightedIndex === 1 && index === 2;

          return (
            <div key={index}>
              <p className="text-sm font-medium text-gray-700 mb-2">
                {processSteps[index]}
              </p>
              <motion.div
                key={index}
                className="relative rounded-lg overflow-hidden"
                animate={{
                  scale: isHighlighted ? 1.03 : 1,
                  opacity: isLowBrightness ? 0.7 : isDimmed ? 0.5 : 1,
                  filter: isLowBrightness
                    ? 'brightness(0.8)'
                    : isDimmed
                    ? 'brightness(0.6)'
                    : 'brightness(1.1)',
                }}
                transition={{
                  duration: 0.8,
                  ease: 'easeInOut',
                }}
                style={{
                  boxShadow: isHighlighted
                    ? '0 10px 40px rgba(0, 0, 0, 0.15)'
                    : '0 2px 8px rgba(0, 0, 0, 0.05)',
                }}
              >
                <Image
                  src={src}
                  alt={`HYP ${processSteps[index]}`}
                  priority={index === 0}
                  width={200}
                  height={200}
                  className="w-full h-auto p-2"
                />
              </motion.div>
            </div>
          );
        })}
      </div>

      {/* Mobile: Vertical layout with tighter spacing */}
      <div className="md:hidden space-y-4">
        {processImages.map((src, index) => (
          <div key={index} className="space-y-2">
            <p className="text-sm font-medium text-neutral-700">
              {processSteps[index]}
            </p>
            <ProcessImageMobile
              src={src}
              index={index}
              stepLabel={processSteps[index]}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// 모바일용 이미지 컴포넌트
function ProcessImageMobile({
  src,
  index,
  stepLabel,
}: {
  src: string;
  index: number;
  stepLabel: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.7 });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 1 }}
      animate={
        isInView
          ? {
              opacity: 1,
              scale: 1.03,
            }
          : { opacity: 0, scale: 1 }
      }
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative rounded-lg overflow-hidden"
    >
      <Image
        src={src}
        alt={`HYP ${stepLabel}`}
        width={200}
        height={200}
        className="w-full h-auto p-4"
        priority={index === 0}
      />
    </motion.div>
  );
}

// 사용 예시 섹션 컴포넌트
function ExampleSection() {
  const tHome = useTranslations('home');

  const examples = [
    {
      src: '/images/result-examples/result1-youtube.png',
      title: tHome('example1Title'),
      description1: tHome('example1Desc1'),
      description2: tHome('example1Desc2'),
      align: 'left' as const,
    },
    {
      src: '/images/result-examples/result2-macbook.png',
      title: tHome('example2Title'),
      description1: tHome('example2Desc1'),
      description2: tHome('example2Desc2'),
      align: 'right' as const,
    },
    {
      src: '/images/result-examples/result3-notion.png',
      title: tHome('example3Title'),
      description1: tHome('example3Desc1'),
      description2: tHome('example3Desc2'),
      align: 'left' as const,
    },
  ];

  return (
    <section className="py-8 md:py-12 border-t border-neutral-200">
      {/* Section Header */}
      <div className="mb-6 md:mb-8">
        <h2 className="text-md font-semibold text-neutral-900 text-center">
          {tHome('exampleTitle').replace(' 🎨', '')}
        </h2>
      </div>

      {/* Examples List */}
      <div className="space-y-10 md:space-y-12">
        {examples.map((example, index) => (
          <div
            key={index}
            className={`flex flex-col md:flex-row items-center gap-4 md:gap-6 ${
              example.align === 'right' ? 'md:flex-row-reverse' : ''
            }`}
          >
            {/* Image */}
            <div className="w-full md:w-3/5">
              <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
                <Image
                  src={example.src}
                  alt={`Example ${index + 1}: ${example.title}`}
                  width={400}
                  height={500}
                  className="w-full h-auto"
                />
              </div>
            </div>

            {/* Text */}
            <div
              className={`w-full md:w-2/5 ${
                example.align === 'right' ? 'md:text-right' : 'md:text-left'
              } text-center`}
            >
              <span className="inline-block text-xs font-medium text-neutral-500 tracking-wide uppercase mb-2">
                {tHome('exampleCase')} {index + 1}
              </span>
              <p className="text-sm font-semibold text-neutral-900 mb-1">
                {example.title}
              </p>
              <p className="text-sm text-neutral-700 leading-relaxed">
                {example.description1}
                <br />
                {example.description2}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
