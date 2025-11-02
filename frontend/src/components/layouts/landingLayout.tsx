import LandingHeader from '@/components/atoms/landingHeader';



export default async function LandingLayout({ children }: any) {


    return (
        <div className="relative min-h-screen">

            <LandingHeader />

            {children}

            <style dangerouslySetInnerHTML={{
                __html: `
          .framer-content {
            width: 100%;
          }
          .framer-content header {
            display: none !important;
          }
          .framer-content > * {
            margin-top: 0 !important;
          }
          .framer-content body {
            overflow-x: hidden;
          }
        `
            }} />
        </div>
    );
}
