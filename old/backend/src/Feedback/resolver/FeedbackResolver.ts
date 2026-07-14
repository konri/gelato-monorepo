import { Arg, Authorized, Ctx, Field, FieldResolver, InputType, Mutation, Resolver, Root } from 'type-graphql'
import fs from 'fs'
import path from 'path'
// @ts-ignore
import { StandardDialect, TemplateEngine } from 'thymeleaf'
import sgMail from '@sendgrid/mail'
import { Role } from '../../User/objectType/Role'
import { Context } from '../../shared/interface/Context'
import { User } from '../../User/objectType/User'
import { Feedback } from '../objectType/Feedback'

@InputType()
class FeedbackInput {
  @Field(() => String)
  comment: string

  @Field(() => String, { nullable: true })
  topic: string

  @Field(() => String, { nullable: true })
  email: string
}

@Resolver(Feedback)
export class FeedbackResolver {
  @FieldResolver(() => User)
  user(@Root() meditationRating: Feedback, @Ctx() ctx: Context) {
    return ctx.prisma.feedback
      .findFirst({
        where: { id: meditationRating.id },
      })
      .user()
  }

  @Authorized([Role.CLIENT, Role.OWNER, Role.COOPERATOR, Role.ADMIN])
  @Mutation(() => Feedback)
  createFeedback(@Arg('data') data: FeedbackInput, @Ctx() ctx: Context) {
    const { user } = ctx.req
    const { topic, comment, email } = data

    // send email
    const templateVars = { topic, comment, email }
    const emailTemplate: string = fs.readFileSync(
      path.resolve(__dirname, '../../public/Messaging/template/feedback.html'),
      'utf8'
    )
    const templateEngine = new TemplateEngine({
      dialects: [new StandardDialect('th')],
    })

    templateEngine
      .process(emailTemplate, templateVars)
      .then(async (feedbackEmail: string) => {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY!)
        const msg = {
          to: process.env.FEEDBACK_TO,
          from: process.env.SENDGRID_FROM, // Change to your verified sender
          subject: 'Feedback - EasyBons',
          html: feedbackEmail,
        }
        await sgMail.send(msg as any)
      })
      .catch((e: string) => console.log(JSON.stringify(e)))

    return ctx.prisma.feedback.create({
      data: {
        comment,
        topic,
        email,
        user: { connect: { id: user!.id } },
      },
    })
  }
}
