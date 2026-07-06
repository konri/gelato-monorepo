type CardWithRelations = {
  stampsCollected: number
  stampsUsed: number
  stampsRequired: number
  template?: {
    milestones?: Array<{
      id: string
      isActive: boolean
      stampsRequired: number
      reward?: unknown
      [key: string]: unknown
    }>
    rewardTitle?: string
    rewardDescription?: string
    rewardType?: string
    rewardDiscountPercent?: number
    rewardDiscountAmount?: number
    [key: string]: unknown
  } | null
  claimedMilestones: Array<{
    id: string
    milestoneId: string | null
    isRedeemed: boolean
    claimedAt?: Date
    redeemedAt?: Date | null
    milestone?: { stampsRequired?: number; [key: string]: unknown } | null
    [key: string]: unknown
  }>
  [key: string]: unknown
}

type AvailableReward = {
  type: 'MILESTONE' | 'MAIN_REWARD'
  milestone?: unknown
  mainRewardTitle?: string
  mainRewardDescription?: string
  mainRewardType?: string
  mainRewardDiscountPercent?: number
  mainRewardDiscountAmount?: number
}

type EnrichedClaimedMilestone = {
  isAvailable: boolean
  isClaimed: boolean
  isReadyToRedeem: boolean
  [key: string]: unknown
}

type MainRewardStatus = {
  id?: string
  isAvailable: boolean
  canClaim: boolean
  isClaimed: boolean
  isRedeemed: boolean
  isReadyToRedeem: boolean
  rewardDetails: {
    title: string
    description?: string
    type?: string
    discountPercent?: number
    discountAmount?: number
  } | null
  claimedAt?: Date
  redeemedAt?: Date | null
} | null

export function enrichCardWithRewards(card: CardWithRelations) {
  const milestoneRewards: AvailableReward[] = (card.template?.milestones ?? [])
    .filter((m) => m.isActive && card.stampsCollected >= m.stampsRequired)
    .filter((m) => !card.claimedMilestones.some((cm) => cm.milestoneId === m.id))
    .map((milestone) => ({ type: 'MILESTONE' as const, milestone }))

  const mainRewardClaimed = card.claimedMilestones.find((cm) => cm.milestoneId === null)
  const isCompleted = card.stampsUsed >= card.stampsRequired
  const isAvailable = card.stampsCollected >= card.stampsRequired && !isCompleted
  const isClaimed = !!mainRewardClaimed

  const mainReward: AvailableReward[] =
    isAvailable && !isClaimed
      ? [
          {
            type: 'MAIN_REWARD' as const,
            mainRewardTitle: card.template?.rewardTitle,
            mainRewardDescription: card.template?.rewardDescription,
            mainRewardType: card.template?.rewardType,
            mainRewardDiscountPercent: card.template?.rewardDiscountPercent,
            mainRewardDiscountAmount: card.template?.rewardDiscountAmount,
          },
        ]
      : []

  const availableRewards = [...milestoneRewards, ...mainReward]

  const enrichedClaimedMilestones: EnrichedClaimedMilestone[] = card.claimedMilestones.map((cm) => {
    const milestoneStampsRequired = cm.milestone?.stampsRequired || card.stampsRequired
    return {
      ...cm,
      isAvailable: card.stampsCollected >= milestoneStampsRequired,
      isClaimed: true,
      isReadyToRedeem: !cm.isRedeemed,
    }
  })

  const mainRewardStatus: MainRewardStatus =
    isAvailable || isClaimed
      ? {
          id: mainRewardClaimed?.id,
          isAvailable,
          canClaim: isAvailable && !isClaimed,
          isClaimed,
          isRedeemed: mainRewardClaimed?.isRedeemed || false,
          isReadyToRedeem: isClaimed && !mainRewardClaimed?.isRedeemed,
          rewardDetails:
            isClaimed && card.template?.rewardTitle
              ? {
                  title: card.template.rewardTitle,
                  description: card.template.rewardDescription,
                  type: card.template.rewardType,
                  discountPercent: card.template.rewardDiscountPercent,
                  discountAmount: card.template.rewardDiscountAmount,
                }
              : null,
          claimedAt: mainRewardClaimed?.claimedAt,
          redeemedAt: mainRewardClaimed?.redeemedAt,
        }
      : null

  return {
    ...card,
    availableRewards,
    claimedMilestones: enrichedClaimedMilestones,
    mainRewardClaimed: mainRewardStatus,
  }
}
