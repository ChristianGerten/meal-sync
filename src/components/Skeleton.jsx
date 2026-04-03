export function SkeletonBox({ width, height, borderRadius = '8px', style = {} }) {
  return (
    <div style={{
      width: width || '100%',
      height: height || '16px',
      borderRadius,
      background: 'var(--color-surface-2)',
      animation: 'skeleton-pulse 1.5s ease-in-out infinite',
      ...style
    }} />
  )
}

export function SkeletonRecipeCard() {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '0.5px solid var(--color-border)',
      borderRadius: '16px', overflow: 'hidden'
    }}>
      <div style={{
        aspectRatio: '4/3',
        background: 'var(--color-surface-2)',
        animation: 'skeleton-pulse 1.5s ease-in-out infinite'
      }} />
      <div style={{padding: '10px', display: 'flex', flexDirection: 'column', gap: '8px'}}>
        <SkeletonBox height="14px" width="80%" />
        <SkeletonBox height="10px" width="50%" />
        <div style={{display: 'flex', gap: '3px'}}>
          {[1,2,3,4,5].map(i => (
            <SkeletonBox key={i} width="16px" height="16px" borderRadius="50%" />
          ))}
        </div>
      </div>
    </div>
  )
}

export function SkeletonPlanDay() {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '0.5px solid var(--color-border)',
      borderRadius: '16px', overflow: 'hidden'
    }}>
      <div style={{
        padding: '10px 14px',
        borderBottom: '0.5px solid var(--color-border)'
      }}>
        <SkeletonBox height="10px" width="60px" />
      </div>
      <div style={{
        padding: '14px',
        display: 'flex', alignItems: 'center', gap: '12px'
      }}>
        <SkeletonBox width="44px" height="44px" borderRadius="12px" style={{flexShrink: 0}} />
        <div style={{flex: 1, display: 'flex', flexDirection: 'column', gap: '6px'}}>
          <SkeletonBox height="14px" width="70%" />
          <SkeletonBox height="10px" width="40%" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonShoppingGroup() {
  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '0.5px solid var(--color-border)',
      borderRadius: '16px', overflow: 'hidden'
    }}>
      <div style={{
        padding: '11px 14px',
        borderBottom: '0.5px solid var(--color-border)'
      }}>
        <SkeletonBox height="10px" width="80px" />
      </div>
      {[1, 2, 3].map(i => (
        <div key={i} style={{
          padding: '13px 14px',
          display: 'flex', alignItems: 'center', gap: '12px',
          borderTop: i > 1 ? '0.5px solid var(--color-border)' : 'none'
        }}>
          <SkeletonBox width="24px" height="24px" borderRadius="7px" style={{flexShrink: 0}} />
          <SkeletonBox height="14px" width={i === 1 ? '60%' : i === 2 ? '75%' : '50%'} />
          <SkeletonBox height="12px" width="40px" style={{marginLeft: 'auto', flexShrink: 0}} />
        </div>
      ))}
    </div>
  )
}

// Globale CSS Animation — einmal einbinden
export function SkeletonStyles() {
  return (
    <style>{`
      @keyframes skeleton-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
      }
    `}</style>
  )
}