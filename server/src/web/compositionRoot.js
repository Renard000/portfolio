import { createClient } from '@supabase/supabase-js';
import { S3Client } from '@aws-sdk/client-s3';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

import StorageClient from '../dal/clients/StorageClient.js';
import CdnSigner, { UnconfiguredStorage } from '../dal/clients/CdnSigner.js';
import VideoRepository from '../dal/repositories/VideoRepository.js';
import VideoSeriesRepository from '../dal/repositories/VideoSeriesRepository.js';
import VideoService from '../bll/services/VideoService.js';
import VideoUploadService from '../bll/services/VideoUploadService.js';
import PlaybackService from '../bll/services/PlaybackService.js';
import VideoController from './controllers/VideoController.js';
import VideoAdminController from './controllers/VideoAdminController.js';
import { ServiceUnavailableError } from '../domain/errors/index.js';
import EmailClient, { ConsoleEmailClient } from '../dal/clients/EmailClient.js';
import FirebaseAdmin from '../dal/clients/FirebaseAdmin.js';
import CertificationRepository from '../dal/repositories/CertificationRepository.js';
import AwardRepository from '../dal/repositories/AwardRepository.js';
import NewsletterRepository from '../dal/repositories/NewsletterRepository.js';
import PushSubscriptionRepository from '../dal/repositories/PushSubscriptionRepository.js';
import ContactRepository from '../dal/repositories/ContactRepository.js';
import ArticleRepository from '../dal/repositories/ArticleRepository.js';
import AuthRepository from '../dal/repositories/AuthRepository.js';
import CommentRepository from '../dal/repositories/CommentRepository.js';
import MessageRepository from '../dal/repositories/MessageRepository.js';
import ProjectRepository from '../dal/repositories/ProjectRepository.js';
import SkillRepository from '../dal/repositories/SkillRepository.js';
import DashboardRepository from '../dal/repositories/DashboardRepository.js';

import CertificationService from '../bll/services/CertificationService.js';
import AwardService from '../bll/services/AwardService.js';
import NewsletterService from '../bll/services/NewsletterService.js';
import PushSubscriptionService from '../bll/services/PushSubscriptionService.js';
import SubscriberAdminService from '../bll/services/SubscriberAdminService.js';
import PublicationSubject from '../bll/events/PublicationSubject.js';
import EmailPublicationObserver from '../bll/events/EmailPublicationObserver.js';
import PushPublicationObserver from '../bll/events/PushPublicationObserver.js';
import ContactService from '../bll/services/ContactService.js';
import ArticleService from '../bll/services/ArticleService.js';
import AuthService from '../bll/services/AuthService.js';
import CommentService from '../bll/services/CommentService.js';
import MessageService from '../bll/services/MessageService.js';
import ProjectService from '../bll/services/ProjectService.js';
import SkillService from '../bll/services/SkillService.js';
import DashboardService from '../bll/services/DashboardService.js';

import CertificationController from './controllers/CertificationController.js';
import AwardController from './controllers/AwardController.js';
import NewsletterController from './controllers/NewsletterController.js';
import ContactController from './controllers/ContactController.js';
import SubscriberAdminController from './controllers/SubscriberAdminController.js';
import ArticleController from './controllers/ArticleController.js';
import AdminContentController from './controllers/AdminContentController.js';
import CrudController from './controllers/CrudController.js';

/** Seul fichier qui fait des `new` sur clients, repositories, services et contrôleurs. */
export function buildContainer(config) {
  const supabase = createClient(config.supabaseUrl, config.serviceRoleKey, {
    auth: { persistSession: false },
  });

  // DAL — Firebase Admin est initialisé à la première notification seulement
  const firebaseAdmin = new FirebaseAdmin(() => {
    const app = getApps()[0] || initializeApp({ credential: cert(config.firebase) });
    return getMessaging(app);
  });
  const emailClient = config.email.apiKey
    ? new EmailClient(config.email.apiKey, config.email.from)
    : new ConsoleEmailClient();

  // Vidéos : le client S3 n'est créé qu'ici, puis injecté dans StorageClient
  const unavailable = () => {
    throw new ServiceUnavailableError('Service vidéo non configuré');
  };
  const { aws, cloudfront } = config;
  const storage =
    aws.accessKeyId && aws.secretAccessKey && aws.bucket
      ? new StorageClient(
          new S3Client({
            region: aws.region,
            credentials: {
              accessKeyId: aws.accessKeyId,
              secretAccessKey: aws.secretAccessKey,
            },
          }),
          aws.bucket
        )
      : new UnconfiguredStorage(unavailable);
  const cdnSigner =
    cloudfront.url && cloudfront.keyPairId && cloudfront.privateKey
      ? new CdnSigner(cloudfront.keyPairId, cloudfront.privateKey, cloudfront.url)
      : new UnconfiguredStorage(unavailable);
  const videoRepository = new VideoRepository(supabase);
  const videoSeriesRepository = new VideoSeriesRepository(supabase);

  const certificationRepository = new CertificationRepository(supabase);
  const awardRepository = new AwardRepository(supabase);
  const newsletterRepository = new NewsletterRepository(supabase);
  const pushSubscriptionRepository = new PushSubscriptionRepository(supabase);
  const articleRepository = new ArticleRepository(supabase);
  const authRepository = new AuthRepository(supabase);
  const contactRepository = new ContactRepository(supabase);
  const commentRepository = new CommentRepository(supabase);
  const messageRepository = new MessageRepository(supabase);
  const projectRepository = new ProjectRepository(supabase);
  const skillRepository = new SkillRepository(supabase);
  const dashboardRepository = new DashboardRepository(supabase);

  // BLL
  const sender = { ...config.email.sender, site: config.siteUrl };
  // Observer : chaque service annonce ses publications, les canaux s'abonnent ici
  const publications = new PublicationSubject();
  publications.subscribe(
    new EmailPublicationObserver(newsletterRepository, emailClient, {
      siteUrl: config.siteUrl,
      publicApiUrl: config.email.publicApiUrl,
      sender,
    })
  );
  publications.subscribe(
    new PushPublicationObserver(pushSubscriptionRepository, firebaseAdmin, {
      siteUrl: config.siteUrl,
    })
  );
  const certificationService = new CertificationService(
    certificationRepository,
    publications
  );
  const awardService = new AwardService(awardRepository, publications);
  const newsletterService = new NewsletterService(newsletterRepository, emailClient, {
    publicApiUrl: config.email.publicApiUrl,
    sender,
  });
  const pushSubscriptionService = new PushSubscriptionService(pushSubscriptionRepository);
  const subscriberAdminService = new SubscriberAdminService(
    newsletterRepository,
    pushSubscriptionRepository
  );
  const videoService = new VideoService(
    videoSeriesRepository,
    videoRepository,
    storage,
    publications,
    {
      cdnUrl: cloudfront.url,
    }
  );
  const videoUploadService = new VideoUploadService(
    videoSeriesRepository,
    videoRepository,
    storage,
    {
      maxVideoBytes: config.maxVideoBytes,
    }
  );
  const playbackService = new PlaybackService(
    videoRepository,
    videoSeriesRepository,
    cdnSigner
  );
  const articleService = new ArticleService(
    articleRepository,
    publications,
    commentRepository
  );
  const commentService = new CommentService(commentRepository, articleRepository);
  const messageService = new MessageService(messageRepository);
  const projectService = new ProjectService(projectRepository, publications);
  const skillService = new SkillService(skillRepository);
  const dashboardService = new DashboardService(dashboardRepository);
  const authService = new AuthService(authRepository);
  const contactService = new ContactService(contactRepository, emailClient, {
    notifyTo: config.contact.notifyTo,
  });

  // Web
  return {
    supabase,
    authService,
    articleService,
    certificationController: new CertificationController(certificationService),
    awardController: new AwardController(awardService),
    newsletterController: new NewsletterController(
      newsletterService,
      pushSubscriptionService,
      { siteUrl: config.siteUrl }
    ),
    videoController: new VideoController(videoService, playbackService),
    videoAdminController: new VideoAdminController(videoService, videoUploadService),
    contactController: new ContactController(contactService),
    articleController: new ArticleController(articleService, commentService),
    projectController: new CrudController(projectService),
    skillController: new CrudController(skillService),
    adminContentController: new AdminContentController({
      articleService,
      commentService,
      messageService,
      dashboardService,
    }),
    subscriberAdminController: new SubscriberAdminController(
      subscriberAdminService,
      newsletterService
    ),
  };
}
