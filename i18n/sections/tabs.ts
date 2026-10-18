// Translation data for the 6 (tabs) screens: jobs feed, applications, saved,
// alerts, messages, explore. This file is merged into the shared
// i18n/translations.ts by a separate process — do not import it directly
// from translations.ts; components should keep reading through useT().

export interface TabsTranslations {
  jobsFeed: {
    title: string;
    searchPlaceholder: string;
    sortAll: string;
    sortRecent: string;
    sortPopular: string;
    loadError: string;
    retry: string;
    emptyState: string;
    jobsWithApplications: string;
    jobsFound: string;
    searchingFor: string;
  };
  applications: {
    title: string;
    filterAll: string;
    filterActive: string;
    filterClosed: string;
    loadError: string;
    retry: string;
    emptyTitle: string;
    emptyHint: string;
    unknownFirm: string;
    appliedPrefix: string;
    messageBtn: string;
    withdrawBtn: string;
    withdrawAlertTitle: string;
    withdrawAlertMessagePrefix: string;
    withdrawAlertCancel: string;
    withdrawAlertConfirm: string;
    interviewScheduledTitle: string;
    joinMeeting: string;
    statusPendingReview: string;
    statusForwardedToFirm: string;
    statusReviewing: string;
    statusShortlisted: string;
    statusInterview: string;
    statusOffer: string;
    statusRejected: string;
    platformZoom: string;
    platformGoogleMeet: string;
    platformTeams: string;
    platformPhone: string;
    platformInPerson: string;
    platformOther: string;
    interviewStatusScheduled: string;
    interviewStatusConfirmed: string;
    interviewStatusCompleted: string;
    interviewStatusCancelled: string;
    interviewStatusRescheduled: string;
  };
  saved: {
    title: string;
    loadError: string;
    retry: string;
    emptyTitle: string;
    emptyHint: string;
  };
  alerts: {
    title: string;
    markAllRead: string;
    loadError: string;
    retry: string;
    emptyTitle: string;
    emptyHint: string;
    tapToOpen: string;
    timeJustNow: string;
    timeAgoPrefix: string;
    minSuffix: string;
    hourSuffix: string;
    daySuffix: string;
  };
  messages: {
    title: string;
    noMessagesYet: string;
    startConversationWith: string;
    emptyInboxHint: string;
    messagePlaceholder: string;
    youLabel: string;
    youPrefix: string;
    readLabel: string;
    timeJustNow: string;
    timeYesterday: string;
    timeAgoPrefix: string;
    minSuffix: string;
    hourSuffix: string;
    daySuffix: string;
  };
  explore: {
    eyebrow: string;
    title: string;
    badgeSoon: string;
    jobSearchTitle: string;
    jobSearchDesc: string;
    smartMatchingTitle: string;
    smartMatchingDesc: string;
    oneClickApplyTitle: string;
    oneClickApplyDesc: string;
    networkingTitle: string;
    networkingDesc: string;
  };
}

export const tabsTranslations: { en: TabsTranslations; fr: TabsTranslations } = {
  en: {
    jobsFeed: {
      title: 'Jobs',
      searchPlaceholder: 'Search for jobs',
      sortAll: 'All',
      sortRecent: 'Most Recent',
      sortPopular: 'Most Applied',
      loadError: 'Could not load jobs',
      retry: 'Retry',
      emptyState: 'No jobs found',
      jobsWithApplications: 'jobs with applications',
      jobsFound: 'jobs found',
      searchingFor: 'for',
    },
    applications: {
      title: 'Applications',
      filterAll: 'All',
      filterActive: 'Active',
      filterClosed: 'Closed',
      loadError: 'Could not load applications',
      retry: 'Retry',
      emptyTitle: 'No applications yet',
      emptyHint: 'Apply to jobs to track them here',
      unknownFirm: 'Unknown firm',
      appliedPrefix: 'Applied',
      messageBtn: 'Message',
      withdrawBtn: 'Withdraw',
      withdrawAlertTitle: 'Withdraw application',
      withdrawAlertMessagePrefix: 'Remove your application for',
      withdrawAlertCancel: 'Cancel',
      withdrawAlertConfirm: 'Withdraw',
      interviewScheduledTitle: 'Interview Scheduled',
      joinMeeting: 'Join meeting',
      statusPendingReview: 'Pending Review',
      statusForwardedToFirm: 'Forwarded to Firm',
      statusReviewing: 'Reviewing',
      statusShortlisted: 'Shortlisted',
      statusInterview: 'Interview',
      statusOffer: 'Offer Received',
      statusRejected: 'Rejected',
      platformZoom: 'Zoom',
      platformGoogleMeet: 'Google Meet',
      platformTeams: 'Microsoft Teams',
      platformPhone: 'Phone Call',
      platformInPerson: 'In Person',
      platformOther: 'Other',
      interviewStatusScheduled: 'Scheduled',
      interviewStatusConfirmed: 'Confirmed',
      interviewStatusCompleted: 'Completed',
      interviewStatusCancelled: 'Cancelled',
      interviewStatusRescheduled: 'Rescheduled',
    },
    saved: {
      title: 'Saved Jobs',
      loadError: 'Could not load saved jobs',
      retry: 'Retry',
      emptyTitle: 'No saved jobs',
      emptyHint: 'Tap ❤️ on any job to save it here',
    },
    alerts: {
      title: 'Alerts',
      markAllRead: 'Mark all read',
      loadError: 'Could not load alerts',
      retry: 'Retry',
      emptyTitle: 'No alerts yet',
      emptyHint: "You're all caught up!",
      tapToOpen: 'Tap to open',
      timeJustNow: 'just now',
      timeAgoPrefix: '',
      minSuffix: 'm ago',
      hourSuffix: 'h ago',
      daySuffix: 'd ago',
    },
    messages: {
      title: 'Inbox',
      noMessagesYet: 'No messages yet',
      startConversationWith: 'Start the conversation with',
      emptyInboxHint: 'Once a recruiter contacts you about your application, conversations will appear here.',
      messagePlaceholder: 'Message',
      youLabel: 'You',
      youPrefix: 'You: ',
      readLabel: 'Read',
      timeJustNow: 'just now',
      timeYesterday: 'Yesterday',
      timeAgoPrefix: '',
      minSuffix: 'm ago',
      hourSuffix: 'h ago',
      daySuffix: 'd ago',
    },
    explore: {
      eyebrow: "WHAT'S COMING",
      title: 'Built for your\ncareer growth',
      badgeSoon: 'Soon',
      jobSearchTitle: 'Job Search',
      jobSearchDesc: 'Browse thousands of opportunities tailored to your skills.',
      smartMatchingTitle: 'Smart Matching',
      smartMatchingDesc: 'AI-powered recommendations based on your profile.',
      oneClickApplyTitle: 'One-Click Apply',
      oneClickApplyDesc: 'Apply to multiple jobs instantly with your saved profile.',
      networkingTitle: 'Networking',
      networkingDesc: 'Connect with recruiters and professionals in your field.',
    },
  },
  fr: {
    jobsFeed: {
      title: 'Emplois',
      searchPlaceholder: "Rechercher des offres d'emploi",
      sortAll: 'Toutes',
      sortRecent: 'Plus récentes',
      sortPopular: 'Plus demandées',
      loadError: "Impossible de charger les offres d'emploi",
      retry: 'Réessayer',
      emptyState: 'Aucune offre trouvée',
      jobsWithApplications: 'offres avec candidatures',
      jobsFound: 'offres trouvées',
      searchingFor: 'pour',
    },
    applications: {
      title: 'Candidatures',
      filterAll: 'Toutes',
      filterActive: 'Actives',
      filterClosed: 'Clôturées',
      loadError: 'Impossible de charger les candidatures',
      retry: 'Réessayer',
      emptyTitle: 'Aucune candidature pour le moment',
      emptyHint: 'Postulez à des offres pour les suivre ici',
      unknownFirm: 'Entreprise inconnue',
      appliedPrefix: 'Envoyée le',
      messageBtn: 'Message',
      withdrawBtn: 'Retirer',
      withdrawAlertTitle: 'Retirer la candidature',
      withdrawAlertMessagePrefix: 'Retirer votre candidature pour',
      withdrawAlertCancel: 'Annuler',
      withdrawAlertConfirm: 'Retirer',
      interviewScheduledTitle: 'Entretien programmé',
      joinMeeting: 'Rejoindre la réunion',
      statusPendingReview: "En attente d'examen",
      statusForwardedToFirm: "Transmise à l'entreprise",
      statusReviewing: "En cours d'examen",
      statusShortlisted: 'Présélectionnée',
      statusInterview: 'Entretien',
      statusOffer: 'Offre reçue',
      statusRejected: 'Rejetée',
      platformZoom: 'Zoom',
      platformGoogleMeet: 'Google Meet',
      platformTeams: 'Microsoft Teams',
      platformPhone: 'Appel téléphonique',
      platformInPerson: 'En personne',
      platformOther: 'Autre',
      interviewStatusScheduled: 'Programmé',
      interviewStatusConfirmed: 'Confirmé',
      interviewStatusCompleted: 'Terminé',
      interviewStatusCancelled: 'Annulé',
      interviewStatusRescheduled: 'Reporté',
    },
    saved: {
      title: 'Offres sauvegardées',
      loadError: 'Impossible de charger les offres sauvegardées',
      retry: 'Réessayer',
      emptyTitle: 'Aucune offre sauvegardée',
      emptyHint: 'Appuyez sur ❤️ sur une offre pour la sauvegarder ici',
    },
    alerts: {
      title: 'Alertes',
      markAllRead: 'Tout marquer comme lu',
      loadError: 'Impossible de charger les alertes',
      retry: 'Réessayer',
      emptyTitle: 'Aucune alerte pour le moment',
      emptyHint: 'Vous êtes à jour !',
      tapToOpen: 'Appuyez pour ouvrir',
      timeJustNow: "à l'instant",
      timeAgoPrefix: 'il y a ',
      minSuffix: ' min',
      hourSuffix: ' h',
      daySuffix: ' j',
    },
    messages: {
      title: 'Messagerie',
      noMessagesYet: 'Aucun message pour le moment',
      startConversationWith: 'Démarrez la conversation avec',
      emptyInboxHint: "Dès qu'un recruteur vous contacte au sujet de votre candidature, vos conversations apparaîtront ici.",
      messagePlaceholder: 'Message à',
      youLabel: 'Vous',
      youPrefix: 'Vous : ',
      readLabel: 'Lu',
      timeJustNow: "à l'instant",
      timeYesterday: 'Hier',
      timeAgoPrefix: 'il y a ',
      minSuffix: ' min',
      hourSuffix: ' h',
      daySuffix: ' j',
    },
    explore: {
      eyebrow: 'À VENIR',
      title: 'Conçu pour votre\névolution de carrière',
      badgeSoon: 'Bientôt',
      jobSearchTitle: "Recherche d'emploi",
      jobSearchDesc: "Parcourez des milliers d'opportunités adaptées à vos compétences.",
      smartMatchingTitle: 'Recommandations intelligentes',
      smartMatchingDesc: "Des suggestions basées sur l'IA, adaptées à votre profil.",
      oneClickApplyTitle: 'Candidature en un clic',
      oneClickApplyDesc: 'Postulez instantanément à plusieurs offres avec votre profil enregistré.',
      networkingTitle: 'Réseautage',
      networkingDesc: 'Connectez-vous avec des recruteurs et des professionnels de votre secteur.',
    },
  },
};
